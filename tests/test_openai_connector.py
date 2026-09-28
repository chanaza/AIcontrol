import tempfile
import unittest

from connectors.openai_connector import OpenAIConnector


class Response:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class Http:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return Response(self.payload)


class OpenAIConnectorTests(unittest.TestCase):
    def make_connector(self, http, cursor_file):
        return OpenAIConnector({
            "OPENAI_API_KEY": "project-key",
            "OPENAI_ADMIN_KEY": "admin-key",
            "HTTP_SESSION": http,
            "CURSOR_FILE": cursor_file,
        })

    def test_audit_uses_admin_endpoint_and_stream_cursor(self):
        with tempfile.TemporaryDirectory() as directory:
            cursor_file = f"{directory}/cursor"
            http = Http({"data": [{"id": "audit_123"}], "has_more": True})
            result = self.make_connector(http, cursor_file).incremental_sync_audit_logs()

            self.assertEqual(result["next_cursor"], "audit_123")
            self.assertEqual(http.calls[0][0], "https://api.openai.com/v1/organization/audit_logs")
            self.assertEqual(http.calls[0][1]["headers"]["Authorization"], "Bearer admin-key")
            with open(f"{cursor_file}.audit", encoding="utf-8") as cursor:
                self.assertEqual(cursor.read(), "audit_123")

    def test_usage_and_cost_require_admin_key_and_send_time_window(self):
        http = Http({"data": []})
        connector = self.make_connector(http, "unused-cursor")
        connector.sync_usage(100, 200, group_by=["project_id", "model"])
        connector.sync_cost(100, 200)

        self.assertEqual(http.calls[0][0], "https://api.openai.com/v1/organization/usage/completions")
        self.assertEqual(http.calls[0][1]["params"]["group_by"], ["project_id", "model"])
        self.assertEqual(http.calls[1][0], "https://api.openai.com/v1/organization/costs")
        self.assertEqual(http.calls[1][1]["headers"]["Authorization"], "Bearer admin-key")

    def test_admin_calls_do_not_fall_back_to_project_key(self):
        connector = OpenAIConnector({"OPENAI_API_KEY": "project-key", "HTTP_SESSION": Http({})})
        with self.assertRaisesRegex(RuntimeError, "Admin API key"):
            connector.sync_cost(100)


if __name__ == "__main__":
    unittest.main()
