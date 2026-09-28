import os
import logging
from typing import Any, Dict, Iterable, Optional

import requests

from connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class OpenAIConnector(BaseConnector):
    """OpenAI connector implemented on top of `BaseConnector`.

    This class keeps only OpenAI-specific behavior; shared behaviors
    (cursor persistence, config) are provided by the base class.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        cfg = config or {}
        super().__init__(cfg)
        self.api_key = cfg.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.admin_api_key = cfg.get("OPENAI_ADMIN_KEY") or os.getenv("OPENAI_ADMIN_KEY")
        self.base_url = (cfg.get("OPENAI_API_URL") or "https://api.openai.com/v1").rstrip("/")
        self.timeout = float(cfg.get("TIMEOUT_SECONDS", 30))
        self.http = cfg.get("HTTP_SESSION") or requests.Session()
        # default cursor file specific to OpenAI to avoid conflicts
        self.cursor_file = cfg.get("CURSOR_FILE") or ".openai_sync_cursor"

    def _headers(self, admin: bool = False) -> Dict[str, str]:
        key = self.admin_api_key if admin else self.api_key
        if not key:
            key_type = "Admin API key" if admin else "API key"
            raise RuntimeError(f"No {key_type} configured for OpenAI connector")
        return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def authenticate(self) -> None:
        """Validate that the credentials needed by the connector are configured."""
        self._headers(admin=False)
        self._headers(admin=True)

    def _get(self, path: str, *, admin: bool, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        response = self.http.get(
            f"{self.base_url}{path}", headers=self._headers(admin=admin), params=params, timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def _cursor_file_for(self, stream: str) -> str:
        return f"{self.cursor_file}.{stream}"

    def _read_stream_cursor(self, stream: str) -> Optional[str]:
        original, self.cursor_file = self.cursor_file, self._cursor_file_for(stream)
        try:
            return self._read_cursor()
        finally:
            self.cursor_file = original

    def _write_stream_cursor(self, stream: str, cursor: str) -> None:
        original, self.cursor_file = self.cursor_file, self._cursor_file_for(stream)
        try:
            self._write_cursor(cursor)
        finally:
            self.cursor_file = original

    def get_sync_cursor(self) -> Optional[str]:
        """Return the audit-stream checkpoint for backwards-compatible callers."""
        return self._read_stream_cursor("audit")

    def test_connection(self) -> bool:
        try:
            self._get("/models", admin=False)
            return True
        except Exception as e:
            logger.exception("OpenAI test_connection failed: %s", e)
            return False

    def get_capabilities(self) -> Dict[str, bool]:
        return {
            "usage": True,
            "cost": True,
            "users": True,
            "sessions": False,
            "audit": True,
            "conversation_content": False,
        }

    def incremental_sync_audit_logs(self, limit: int = 100) -> Dict[str, Any]:
        """Fetch one page of organization audit events and checkpoint its cursor."""
        cursor = self._read_stream_cursor("audit")
        params = {"limit": limit}
        if cursor:
            params["after"] = cursor

        data = self._get("/organization/audit_logs", admin=True, params=params)

        items = data.get("data") or data.get("items") or []
        last_id = None
        if items:
            last = items[-1]
            last_id = last.get("id") or last.get("event_id")
            if last_id:
                self._write_stream_cursor("audit", last_id)

        return {"items": items, "next_cursor": last_id, "has_more": bool(data.get("has_more"))}

    def sync_users(self, limit: int = 100) -> Dict[str, Any]:
        """Fetch one page of organization users. User pagination is caller-driven."""
        return self._get("/organization/users", admin=True, params={"limit": limit})

    def sync_usage(
        self, start_time: int, end_time: Optional[int] = None, *, bucket_width: str = "1d",
        group_by: Optional[Iterable[str]] = None, limit: int = 31,
    ) -> Dict[str, Any]:
        """Return completion usage buckets for an explicit Unix-time window."""
        params: Dict[str, Any] = {"start_time": start_time, "bucket_width": bucket_width, "limit": limit}
        if end_time is not None:
            params["end_time"] = end_time
        if group_by:
            params["group_by"] = list(group_by)
        return self._get("/organization/usage/completions", admin=True, params=params)

    def sync_cost(
        self, start_time: int, end_time: Optional[int] = None, *, bucket_width: str = "1d", limit: int = 31,
    ) -> Dict[str, Any]:
        """Return organization cost buckets for an explicit Unix-time window."""
        params: Dict[str, Any] = {"start_time": start_time, "bucket_width": bucket_width, "limit": limit}
        if end_time is not None:
            params["end_time"] = end_time
        return self._get("/organization/costs", admin=True, params=params)

    def sync_sessions(self):
        raise NotImplementedError("OpenAI does not expose an organization-wide session inventory via Admin APIs")

    def sync_audit(self) -> Dict[str, Any]:
        return self.incremental_sync_audit_logs()

    def sync_content(self):
        raise NotImplementedError("OpenAI does not expose organization-wide conversation content via Admin APIs")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="OpenAI connector scaffold CLI")
    parser.add_argument("--test", action="store_true", help="Test API connectivity")
    parser.add_argument("--capabilities", action="store_true", help="Show capabilities")
    parser.add_argument("--sync-audit", action="store_true", help="Run incremental audit sync")
    args = parser.parse_args()

    c = OpenAIConnector()
    if args.test:
        ok = c.test_connection()
        print("OK" if ok else "FAIL")
    if args.capabilities:
        print(c.get_capabilities())
    if args.sync_audit:
        res = c.incremental_sync_audit_logs()
        print(res)
