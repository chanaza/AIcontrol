from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.models import ActivityEvent, utc_now
from app.store import ActivityStore
from app.tagging import normalize_tags


DATABASE_PATH = os.getenv("AI_CONTROL_DATABASE", "ai_control_plane.sqlite3")
store = ActivityStore(DATABASE_PATH)
app = FastAPI(title="AI Usage Control Plane", version="0.1.0")


class IngestEvent(BaseModel):
    vendor: str = Field(pattern="^(openai|anthropic|microsoft)$")
    product: str
    event_type: str
    occurred_at: str | None = None
    user_email: str | None = None
    department: str | None = None
    model: str | None = None
    cost_usd: float = Field(default=0, ge=0)
    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class IngestRequest(BaseModel):
    events: list[IngestEvent] = Field(min_length=1, max_length=10_000)


CONNECTOR_CATALOG = {
    "openai": {"name": "OpenAI", "description": "API usage, costs, organization users and audit events", "capabilities": {"usage": True, "cost": True, "users": True, "audit": True, "content": False}},
    "anthropic": {"name": "Claude", "description": "Claude platform usage and workspace administration", "capabilities": {"usage": True, "cost": True, "users": True, "audit": False, "content": False}},
    "microsoft": {"name": "Microsoft Copilot", "description": "Microsoft 365 Copilot usage and tenant signals", "capabilities": {"usage": True, "cost": False, "users": True, "audit": True, "content": False}},
}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard/summary")
def dashboard_summary(tenant_id: str = "demo") -> dict[str, Any]:
    return store.summary(tenant_id)


@app.get("/api/tags")
def tags(tenant_id: str = "demo") -> dict[str, Any]:
    return {"tenant_id": tenant_id, "tags": store.tag_summary(tenant_id)}


@app.get("/api/connectors")
def connectors(tenant_id: str = "demo") -> dict[str, Any]:
    existing = {item["vendor"]: item for item in store.connections(tenant_id)}
    items = []
    for vendor, details in CONNECTOR_CATALOG.items():
        connection = existing.get(vendor)
        items.append({
            "vendor": vendor, **details,
            "status": connection["status"] if connection else "not_connected",
            "last_synced_at": connection["last_synced_at"] if connection else None,
            "capabilities": connection["capabilities"] if connection else details["capabilities"],
        })
    return {"tenant_id": tenant_id, "connectors": items}


@app.post("/api/tenants/{tenant_id}/connectors/{vendor}/connect", status_code=201)
def connect_connector(tenant_id: str, vendor: str) -> dict[str, str]:
    details = CONNECTOR_CATALOG.get(vendor)
    if not details:
        raise HTTPException(status_code=404, detail="Unknown connector")
    # OAuth/API-key consent will replace this state transition in the production integration flow.
    store.save_connection(tenant_id, vendor, "connected", utc_now(), details["capabilities"])
    return {"vendor": vendor, "status": "connected"}


@app.post("/api/tenants/{tenant_id}/events", status_code=201)
def ingest_events(tenant_id: str, payload: IngestRequest) -> dict[str, int]:
    events = [
        ActivityEvent(
            tenant_id=tenant_id, vendor=event.vendor, product=event.product, event_type=event.event_type,
            occurred_at=event.occurred_at or utc_now(), user_email=event.user_email,
            department=event.department, model=event.model, cost_usd=event.cost_usd,
            input_tokens=event.input_tokens, output_tokens=event.output_tokens,
            tags=tuple(normalize_tags(event.vendor, event.tags, event.department)), metadata=event.metadata,
        )
        for event in payload.events
    ]
    return {"ingested": store.add_events(events)}


@app.post("/api/demo/seed", status_code=201)
def seed_demo() -> dict[str, int]:
    demo_events = [
        {"vendor": "openai", "product": "API", "event_type": "completion", "user_email": "maya@example.com", "department": "Engineering", "model": "gpt-4.1", "cost_usd": 12.4, "tags": ["production", "gpt-4"]},
        {"vendor": "anthropic", "product": "Claude", "event_type": "message", "user_email": "dana@example.com", "department": "Product", "model": "claude-sonnet", "cost_usd": 8.1, "tags": ["prod", "claude"]},
        {"vendor": "microsoft", "product": "Copilot", "event_type": "license_activity", "user_email": "maya@example.com", "department": "Engineering", "cost_usd": 0, "tags": ["copilot", "m365"]},
    ]
    for vendor, details in CONNECTOR_CATALOG.items():
        store.save_connection("demo", vendor, "connected", utc_now(), details["capabilities"])
    return ingest_events("demo", IngestRequest(events=[IngestEvent(**event) for event in demo_events]))


FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/")
def dashboard() -> FileResponse:
    # The React prototype (frontend/, built with `npm run build`) replaces the legacy static page when present.
    built = FRONTEND_DIST / "index.html"
    dashboard_file = built if built.exists() else Path(__file__).parent / "static" / "index.html"
    if not dashboard_file.exists():
        raise HTTPException(status_code=404, detail="Dashboard asset is missing")
    return FileResponse(dashboard_file)
