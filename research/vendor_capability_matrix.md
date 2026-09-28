# Vendor capability matrix — initial draft

תמצית ראשונית מהמחקר ההתחלתי (מקורות רשמיים מצוטטים): OpenAI, Anthropic (Claude), Microsoft Copilot / Microsoft Graph.

## Sources
- OpenAI API docs (guides, admin APIs, rate limits, sessions): https://developers.openai.com/api/docs/
- OpenAI Admin APIs (audit, spend limits, projects): https://developers.openai.com/api/docs/guides/admin-apis
- OpenAI Agents / Sessions: https://developers.openai.com/api/docs/guides/agents-api/sessions/manage.md
- Anthropic / Claude platform docs: https://platform.claude.com/docs/
- Microsoft Copilot hub & Microsoft Graph overview: https://learn.microsoft.com/en-us/microsoft-365/copilot/ and https://learn.microsoft.com/en-us/graph/overview

---

## Capability matrix (initial)

Legend: YES = documented API access; MAYBE = documented but may require enterprise/admin enablement or limited fields; NO = not available / not found in public docs.

- OpenAI
  - Usage metrics: YES (agent/session usage, Observability/usage guides)
  - Cost / billing: YES (spend limits, billing guides, pricing pages)
  - Sessions: NO (the Admin API provides organization usage and audit data, but not an organization-wide session inventory)
  - Audit logs / Admin audit: YES (Admin APIs: audit logs endpoint)
  - Conversation content: MAYBE (session items/events available via Agents API when saved; sensitive and subject to retention controls)
  - Auth methods: YES (API keys, Admin API keys, workload identity federation, OAuth in some flows)
  - Rate limits & pagination: YES (detailed guides, response headers)

### OpenAI — endpoint-level details (initial)

- Admin / Organization (Admin APIs)
  - SDK methods: `client.admin.organization.audit_logs.list()`, `client.admin.organization.*` (projects, spend_limits, data_retention)
  - REST/CLI examples referenced in docs: Administration API reference (see https://developers.openai.com/api/docs/guides/admin-apis and https://developers.openai.com/api/reference/administration/overview)
  - Common paths (SDK-wrapped): Audit logs, Spend limits, Invites, Users, Projects
  - Auth: requires an Admin API key (`OPENAI_ADMIN_KEY`) or Admin SDK usage. These endpoints are separate from normal API keys and require admin-level permissions.
  - Notes: Audit logs list can be paginated; use `limit` and `after`/cursor semantics as shown in SDK examples.

- Agents / Sessions
  - Scope note: this control-plane connector does not claim organization-wide session or conversation-content collection. Those data are not exposed through the organization Admin API and must remain opt-in, product-specific integrations if added later.

- Spend / Billing
  - Endpoint (Admin): `POST /v1/organization/spend_limit` (set organization spend limit) and project spend alerts via Admin APIs
  - Docs: https://developers.openai.com/api/docs/guides/admin-apis (spend limits examples)
  - Notes: Billing/pricing pages are separate; invoices and detailed billing exports may require console access or billing APIs outside the public API surface.

- Models & Usage
  - Public endpoint: `GET /v1/models` (connectivity check using a standard project API key)
  - Organization metrics: `GET /v1/organization/usage/completions` and `GET /v1/organization/costs` using an Admin API key; time window and bucket parameters are required for a useful sync.
  - Usage headers: rate-limit headers such as `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens` are present on responses and useful for operational monitoring

- Rate limits & error handling
  - OpenAI documents RPM/TPM and other rate limit metrics; responses include `Retry-After` and `x-ratelimit-*` headers. See https://developers.openai.com/api/docs/guides/rate-limits

- Auth summary
  - Regular API key (`OPENAI_API_KEY`) for model and most endpoints
  - Admin API key (`OPENAI_ADMIN_KEY`) for organization-level admin APIs (audit logs, spend limits, invites, projects)
  - Beta headers: some Agents endpoints require `OpenAI-Beta: agents=v1` header per examples
  - Workload identity / OAuth: documented guides for workload identity federation and OAuth for specific flows

---

- Anthropic / Claude
  - Usage metrics: YES (platform.claude docs include "usage monitoring" and usage-cost API links)
  - Cost / billing: YES (pricing & usage-cost pages referenced)
  - Sessions: YES (Managed Agents / Sessions API referenced in docs)
  - Audit logs: MAYBE (admin/workspace management pages exist; explicit audit API not yet confirmed publicly)
  - Conversation content: MAYBE (Sessions / Managed Agents expose events and streaming; availability depends on workspace permissions)
  - Auth methods: YES (API keys; platform console keys; enterprise flows may exist)
  - Rate limits & pagination: YES/MAYBE (rate limits page exists; specifics require deeper read)

- Microsoft (Copilot / Graph)
  - Usage metrics: YES (Microsoft Graph + Copilot connectors, Data Connect can surface usage at scale)
  - Cost / billing: MAYBE (licensing/subscription costs exposed via tenant billing systems; per-token billing not applicable for Copilot)
  - Sessions: MAYBE (Copilot sessions are product-specific; Graph exposes many telemetry endpoints — session-level for Copilot requires checking Copilot-specific APIs)
  - Audit logs: YES (Microsoft Purview / Graph audit logs and Office 365 audit APIs)
  - Conversation content: NO/MAYBE (Copilot data residency and content access governed by Microsoft; direct conversation export is limited and requires explicit capabilities)
  - Auth methods: YES (Azure AD / OAuth 2.0, app registrations, delegated and application permissions)
  - Rate limits & pagination: YES (Graph API guidance on pagination and throttling; Data Connect for large-scale exports)

---

## Next steps (proposed)
1. For each vendor, extract the exact API endpoints (path + method) and required scopes/permissions for: usage, cost, sessions, audit, conversation content.
2. Identify any enterprise-only features or console steps required to enable Admin APIs (e.g., create Admin API key, tenant consent, enable Data Connect, enable Copilot connectors).
3. Produce a detailed capability matrix table (CSV/Markdown) mapping vendor fields → normalized Common AI Activity Model fields and listing gaps.
4. Where docs are ambiguous, prepare a short list of precise questions to ask vendor support or to validate with an enterprise admin.

---

שאלות להבהרה מהמשתמש לפני ההמשך (מתבקשות, אך אפשר גם להמשיך אוטומטית):
- האם להמשיך ולמפות עכשיו endpoint-by-endpoint (כולל דוגמאות curl) או להוציא קודם טבלה עקבית של יכולות בלבד?
- האם יש העדפה ל-format (CSV/Markdown/JSON schema) עבור ה-normalized model output?

---

קובץ זה הוא טיוטה ראשונית; אמשיך להרחיב ולמלא שדות מדויקים עם קישורים מדויקים ל-endpoints ול-scope ברגע שתקבל אישור להמשיך. 
