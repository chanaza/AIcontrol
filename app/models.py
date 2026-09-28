from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class ActivityEvent:
    """Vendor-neutral record accepted from every connector."""

    tenant_id: str
    vendor: str
    product: str
    event_type: str
    occurred_at: str
    user_email: Optional[str] = None
    department: Optional[str] = None
    model: Optional[str] = None
    cost_usd: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    tags: tuple[str, ...] = ()
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result["tags"] = list(self.tags)
        return result


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
