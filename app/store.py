from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

from app.models import ActivityEvent


SCHEMA = """
CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    vendor TEXT NOT NULL,
    product TEXT NOT NULL,
    event_type TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    user_email TEXT,
    department TEXT,
    model TEXT,
    cost_usd REAL NOT NULL DEFAULT 0,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    tags_json TEXT NOT NULL,
    metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_tenant_time ON activity_events(tenant_id, occurred_at DESC);
CREATE TABLE IF NOT EXISTS connector_connections (
    tenant_id TEXT NOT NULL,
    vendor TEXT NOT NULL,
    status TEXT NOT NULL,
    last_synced_at TEXT,
    capabilities_json TEXT NOT NULL,
    PRIMARY KEY (tenant_id, vendor)
);
"""


class ActivityStore:
    def __init__(self, path: str = "ai_control_plane.sqlite3"):
        self.path = Path(path)
        with self._connection() as conn:
            conn.executescript(SCHEMA)

    def _connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def add_events(self, events: Iterable[ActivityEvent]) -> int:
        rows = list(events)
        if not rows:
            return 0
        with self._connection() as conn:
            conn.executemany(
                """INSERT INTO activity_events
                (tenant_id, vendor, product, event_type, occurred_at, user_email, department,
                 model, cost_usd, input_tokens, output_tokens, tags_json, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [
                    (e.tenant_id, e.vendor, e.product, e.event_type, e.occurred_at, e.user_email,
                     e.department, e.model, e.cost_usd, e.input_tokens, e.output_tokens,
                     json.dumps(e.tags), json.dumps(e.metadata or {}))
                    for e in rows
                ],
            )
        return len(rows)

    def summary(self, tenant_id: str) -> dict[str, Any]:
        with self._connection() as conn:
            totals = conn.execute(
                """SELECT COUNT(*) AS events, COUNT(DISTINCT user_email) AS active_users,
                    ROUND(COALESCE(SUM(cost_usd), 0), 2) AS cost_usd
                    FROM activity_events WHERE tenant_id = ?""", (tenant_id,)
            ).fetchone()
            by_vendor = conn.execute(
                """SELECT vendor, COUNT(*) AS events, ROUND(SUM(cost_usd), 2) AS cost_usd
                    FROM activity_events WHERE tenant_id = ? GROUP BY vendor ORDER BY cost_usd DESC""",
                (tenant_id,),
            ).fetchall()
        return {"tenant_id": tenant_id, **dict(totals), "by_vendor": [dict(row) for row in by_vendor]}

    def tag_summary(self, tenant_id: str) -> list[dict[str, Any]]:
        with self._connection() as conn:
            rows = conn.execute(
                "SELECT tags_json, cost_usd, user_email FROM activity_events WHERE tenant_id = ?", (tenant_id,)
            ).fetchall()
        aggregate: dict[str, dict[str, Any]] = {}
        for row in rows:
            for tag in json.loads(row["tags_json"]):
                entry = aggregate.setdefault(tag, {"tag": tag, "events": 0, "cost_usd": 0.0, "users": set()})
                entry["events"] += 1
                entry["cost_usd"] += row["cost_usd"]
                if row["user_email"]:
                    entry["users"].add(row["user_email"])
        return sorted(
            [{"tag": x["tag"], "events": x["events"], "cost_usd": round(x["cost_usd"], 2), "users": len(x["users"])}
             for x in aggregate.values()],
            key=lambda item: (-item["cost_usd"], -item["events"], item["tag"]),
        )

    def connections(self, tenant_id: str) -> list[dict[str, Any]]:
        with self._connection() as conn:
            rows = conn.execute(
                "SELECT vendor, status, last_synced_at, capabilities_json FROM connector_connections WHERE tenant_id = ?",
                (tenant_id,),
            ).fetchall()
        return [{**dict(row), "capabilities": json.loads(row["capabilities_json"])} for row in rows]

    def save_connection(
        self, tenant_id: str, vendor: str, status: str, last_synced_at: str | None, capabilities: dict[str, bool]
    ) -> None:
        with self._connection() as conn:
            conn.execute(
                """INSERT INTO connector_connections (tenant_id, vendor, status, last_synced_at, capabilities_json)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(tenant_id, vendor) DO UPDATE SET
                  status=excluded.status, last_synced_at=excluded.last_synced_at,
                  capabilities_json=excluded.capabilities_json""",
                (tenant_id, vendor, status, last_synced_at, json.dumps(capabilities)),
            )
