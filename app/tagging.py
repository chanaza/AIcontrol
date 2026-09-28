"""Central tag policy and vendor-tag normalization."""

from __future__ import annotations

from typing import Iterable, Set


VENDOR_TAG_ALIASES = {
    "openai": {"gpt-4": "model:gpt-4", "production": "environment:production"},
    "anthropic": {"claude": "model:claude", "prod": "environment:production"},
    "microsoft": {"copilot": "product:copilot", "m365": "product:microsoft-365"},
}


def normalize_tags(vendor: str, tags: Iterable[str], department: str | None = None) -> list[str]:
    """Return de-duplicated canonical tags for cross-vendor aggregation.

    Raw vendor labels are retained under `source:` so an analyst can trace a
    dashboard finding back to its provider.
    """
    aliases = VENDOR_TAG_ALIASES.get(vendor.lower(), {})
    normalized: Set[str] = {"vendor:" + vendor.lower()}
    for tag in tags:
        cleaned = tag.strip().lower().replace(" ", "-")
        if cleaned:
            normalized.add(aliases.get(cleaned, f"source:{cleaned}"))
    if department:
        normalized.add("department:" + department.strip().lower().replace(" ", "-"))
    return sorted(normalized)
