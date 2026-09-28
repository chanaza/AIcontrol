# AI Usage Control Plane — Roadmap

This file records planning, feature state, and start/completion timestamps for the project. I will update the relevant feature entry when work on that feature starts and when it completes.

## Vision
- Centralized, vendor-neutral AI Usage Control Plane that ingests authorized data from an organization's AI providers and produces a normalized, actionable view of usage, cost, sessions, and findings — without acting as a gateway.

## Initial vendors (MVP)
1. OpenAI — ChatGPT Enterprise / Agents API
2. Anthropic — Claude Enterprise / Claude Platform
3. Microsoft — Copilot / Microsoft Graph / Copilot connectors

## MVP scope
- Multi-tenant backend
- Connector framework
- Two real vendor connectors (start with OpenAI & Anthropic; include Microsoft Copilot)
- OAuth/API credential management
- Incremental synchronization and cursor handling
- Common AI Activity Model (Users, Products, Sessions, Events)
- Dashboard (aggregate usage/cost/active users)
- Cross-vendor analytics (user footprints, department breakdown)
- Basic anomaly detection and recommendations
- Connection capability matrix

## How we track features
Each feature below is a single entry with status and optional timestamps. Update this file when you (or I) start or finish work on a feature.

Feature template
```
- Feature: <short name>
  - Owner: <person>
  - Status: not-started | in-progress | blocked | completed
  - Started: <ISO timestamp>  # set when work begins
  - Completed: <ISO timestamp>  # set when work finishes
  - Notes: <short notes, links to design or PRs>
```

## Features

- Feature: Control Plane MVP (API, dashboard, unified tags)
  - Owner: Engineering
  - Status: in-progress
  - Started: 2026-09-28T14:45:00Z
  - Notes: FastAPI/SQLite MVP added with vendor-neutral event ingestion, centralized tag normalization and a Hebrew dashboard. Pending local runtime verification and wiring real connector output into event ingestion.

- Feature: Claude-ready spec prompt
  - Owner: Product
  - Status: completed
  - Started: 2026-09-28T00:00:00Z
  - Completed: 2026-09-28T00:02:00Z
  - Notes: Initial spec prepared for Claude Code and saved to repo.

- Feature: Initial vendor selection
  - Owner: Product/Engineering
  - Status: completed
  - Started: 2026-09-28T00:03:00Z
  - Completed: 2026-09-28T00:05:00Z
  - Notes: Selected OpenAI, Anthropic, Microsoft Copilot for MVP.

- Feature: Vendor API research — OpenAI
  - Owner: Research
  - Status: in-progress
  - Started: 2026-09-28T00:06:00Z
  - Notes: Gathering Admin APIs, Agents Sessions, Audit, Billing endpoints. Draft results in `research/vendor_capability_matrix.md`.

- Feature: OpenAI connector scaffold (Python)
  - Owner: Engineering
  - Status: in-progress
  - Started: 2026-09-28T00:12:00Z
  - Notes: Implemented Admin API users, audit-log cursoring, usage and cost retrieval, with mocked unit tests added. Pending execution in a Python runtime; organization-wide sessions/content remain intentionally unsupported.

- Feature: Vendor API research — Anthropic (Claude)
  - Owner: Research
  - Status: in-progress
  - Started: 2026-09-28T00:06:00Z
  - Notes: Gathering sessions, usage, workspace admin docs.

- Feature: Vendor API research — Microsoft Copilot
  - Owner: Research
  - Status: in-progress
  - Started: 2026-09-28T00:06:00Z
  - Notes: Gathering Copilot hub & Graph/Data Connect guidance.

- Feature: Endpoint-level capability matrix (detailed)
  - Owner: Research
  - Status: not-started
  - Notes: Will map endpoints → normalized fields + scopes.

## Process notes
- UX principle: keep dashboards light and accessible for non-technical users; show data coverage and confidence for every finding.
- Privacy & Data: do not assume content access — explicitly mark where vendors do not expose content or session-level data.
- Security: credentials stored securely (vault/secret manager), and Admin API keys audited per-tenant.

## Links
- Capability draft: `research/vendor_capability_matrix.md`

---

I will update this file at the start and completion of each tracked feature.
