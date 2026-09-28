from __future__ import annotations

import os
from typing import Any, Dict, Optional


class BaseConnector:
    """Abstract base class for vendor connectors.

    Concrete vendor connectors should subclass this and implement the
    vendor-specific API calls. The base class centralizes configuration
    and lightweight cursor persistence to avoid duplicated code across
    connectors.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        cfg = config or {}
        self.config = cfg
        self.base_url = cfg.get("BASE_URL")
        # default cursor file name may be overridden by subclasses
        self.cursor_file = cfg.get("CURSOR_FILE") or ".connector_sync_cursor"

    def authenticate(self) -> None:
        """Perform any authentication steps required by the vendor.

        Implementations may store tokens/credentials on the instance.
        """
        raise NotImplementedError()

    def test_connection(self) -> bool:
        raise NotImplementedError()

    def get_capabilities(self) -> Dict[str, bool]:
        raise NotImplementedError()

    def sync_users(self) -> Any:
        raise NotImplementedError()

    def sync_usage(self) -> Any:
        raise NotImplementedError()

    def sync_cost(self) -> Any:
        raise NotImplementedError()

    def sync_sessions(self) -> Any:
        raise NotImplementedError()

    def sync_audit(self) -> Any:
        raise NotImplementedError()

    def sync_content(self) -> Any:
        raise NotImplementedError()

    def get_sync_cursor(self) -> Optional[str]:
        return self._read_cursor()

    def _read_cursor(self) -> Optional[str]:
        if not os.path.exists(self.cursor_file):
            return None
        with open(self.cursor_file, "r", encoding="utf-8") as f:
            return f.read().strip() or None

    def _write_cursor(self, cursor: str) -> None:
        with open(self.cursor_file, "w", encoding="utf-8") as f:
            f.write(cursor)
