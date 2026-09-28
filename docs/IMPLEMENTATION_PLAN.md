# AI Usage Control Plane — ניתוח פערים ותכנית ביצוע

גרסה 2 · 2026-09-28 · מבוסס על האפיון `docs/GPTProductPlan.txt` ועל הקוד בקומיט `1aac81c`

> **מקור האמת לדרישות הוא `docs/GPTProductPlan.txt`.** המסמך הזה מפרט רק איך מגיעים ממה שקיים בריפו למה שמוגדר שם. הפניות בצורה §N מכוונות לסעיפים באפיון.

## 1. השורה התחתונה

הריפו הנוכחי הוא **שלד הדגמה ולא מערכת**. הוא לא עומד בהגדרת ה-MVP של האפיון (§22):

> "I can connect an enterprise AI account, ingest its authorized data, normalize it, and combine it with another AI provider into one useful organizational view."

כרגע אי אפשר לחבר אף חשבון אמיתי:
- כפתור "חיבור ספק" רק משנה סטטוס ל-`connected` בלי שום אימות (`app/main.py:77-84`).
- מחבר OpenAI קיים, אבל שום דבר לא מפעיל אותו והפלט שלו לא נכנס למערכת. הוא גם מכסה את OpenAI **API Platform** ולא את **ChatGPT Enterprise**, שהוא המוצר שהאפיון מדבר עליו.
- מחבר Anthropic, שהוא **עדיפות 1 באפיון** (§7), ומחבר Microsoft לא קיימים בכלל.
- כל מה שמופיע בדשבורד מגיע משלושה אירועי דמו קשיחים.
- **§24 דורש מחקר API רשמי לפני כתיבת קוד. השלב הזה דולג.** `research/vendor_capability_matrix.md` שטחי, ולא ממפה endpoints, הרשאות, רמת פירוט של sessions ותוכן, או rate limits.

## 2. עמידה בהגדרת ה-MVP (§22)

| # | דרישה | מצב בריפו | פער |
|---|---|---|---|
| 1 | Multi-tenant backend | `tenant_id` חופשי ב-URL | אין אימות משתמשים ואין בידוד בין tenants |
| 2 | Connector framework | `BaseConnector` ריק | אין registry, scheduler, מיפוי או cursors ב-DB |
| 3 | שני מחברים אמיתיים | אין (OpenAI API לא מחובר) | Claude Enterprise ו-ChatGPT Enterprise |
| 4 | ניהול credentials (OAuth/API) | אין | אשף חיבור ב-UI, הצפנה, OAuth ל-Microsoft |
| 5 | Incremental sync | cursor שבור לכיוון הלא נכון | pagination, retry, 429, lookback |
| 6 | Common AI Activity Model (§5) | טבלה שטוחה אחת | Organization, Provider, Product, User, Session, Event |
| 7 | Users | מחרוזת email בלבד | department, team, role, cost_center, identity_source |
| 8 | Products | שדה טקסט | ישות מלאה |
| 9 | Sessions | אין | ישות מלאה, רק כשהספק חושף אותן |
| 10 | Usage | מעורבב עם אירועים | טבלת usage נפרדת עם upsert |
| 11 | Cost | שדה יחיד | הפרדה בין Actual ל-Estimated (§10), ועלות רישיונות |
| 12 | Dashboard (§8) | 3 כרטיסים | כמה, איפה, מי, מה השתנה |
| 13 | Cross-vendor analytics (§9) | סיכום לפי ספק | טביעת רגל לפי משתמש ומחלקה |
| 14 | Basic anomaly detection (§11) | אין | spikes בשימוש, בעלות וב-tokens, heavy users |
| 15 | Basic recommendations (§14) | אין | Finding, Evidence, Impact, Action, Confidence |
| 16 | Capability matrix (§5, §20) | dict קשיח וסותר | מטריצה אמיתית לכל מחבר + Data coverage |

## 3. באגים ובעיות בקוד הקיים

1. **כפילויות נתונים.** אין idempotency. כל seed וכל סנכרון מכפילים את הנתונים (`app/store.py:51-68`).
2. **cursor של audit ב-OpenAI מדפדף אחורה**, כך שאירועים חדשים לא נאספים אחרי הסנכרון הראשון (`connectors/openai_connector/connector.py:88-105`).
3. **usage ו-cost נחתכים אחרי העמוד הראשון.** `has_more` ו-`next_page` לא נקראים.
4. **usage מצטבר ואירועים בודדים באותה טבלה.** לכן המספרים "אירועים" ו"משתמשים פעילים" חסרי משמעות.
5. **מטריצת יכולות סותרת** בין `main.py`, המחבר ומסמך המחקר.
6. **אין אימות משתמשים** על אף endpoint.
7. **הבדיקות לא רצות.** `python -m unittest` מוצא 0 בדיקות, כי חסר `tests/__init__.py`.
8. אין CI, אין migrations ואין Docker. החיבורים ל-SQLite לא נסגרים. ההוראות מיועדות ל-Windows בלבד.

## 4. עקרונות מחייבים מהאפיון

- **DO NOT build an AI Gateway** (§2, §21). אין proxy, אין SDK wrapper ואין client מיוחד. כל הנתונים מגיעים רק מ-APIs רשמיים של הספק, בהרשאה שהארגון נותן.
  → **מה שהספק לא חושף, המערכת לא יודעת, ומציגה את זה במפורש** (§13, §20).
- **אין להמציא APIs** (§7, §24). כל מחבר נבנה רק אחרי תיעוד מדויק של ה-endpoints מתוך התיעוד הרשמי.
- **Actual ≠ Estimated** (§10). הערכת עלות לעולם לא מוצגת כנתון רשמי.
- **Data available ≠ Data analyzed** (§13).
- **Analyze + Recommend בלבד** (§14). פעולות אכיפה (§15) לא נבנות ב-MVP, אבל הממשק של המחבר משאיר להן מקום.
- **Product B, Discovery (§4), לא נבנה**, וגם לא DLP מתקדם או אכיפה בזמן אמת (§22).

## 5. החלטות מוצר נוספות (התקבלו 2026-09-28)

1. **SaaS וגם התקנה אצל הלקוח.** אותו קוד רץ בשני המצבים: image אחד של Docker, Compose ו-Helm, וכל ההגדרות במשתני סביבה. ב-on-prem מפתח ההצפנה נשאר אצל הלקוח.
2. **החיבור לספקים נעשה מתוך ה-UI על ידי מנהל הארגון.** אין "חיבור מראש":
   - Claude Enterprise ו-ChatGPT Enterprise: הדבקת המפתחות הרלוונטיים (Admin, Analytics או Compliance, לפי המחקר), בדיקה חיה, הצגת היכולות שהמפתח באמת פותח, ושמירה מוצפנת.
   - Microsoft: "התחבר עם Microsoft" ו-admin consent ב-Entra. ב-SaaS האפליקציה רשומה פעם אחת כ-multi-tenant. ב-on-prem הלקוח רושם אפליקציה משלו לפי מדריך מובנה במסך.
   - מיד אחרי חיבור מתחיל backfill, ורואים התקדמות, שגיאות וזמן סנכרון אחרון.
3. **ניתוח תוכן שיחות ו-PII הוא יעד חשוב**, בגבולות האפיון: רק דרך APIs רשמיים (Compliance, Graph). האיסוף כבוי כברירת מחדל, והלקוח מפעיל אותו לכל חיבור בנפרד (§17). ל-DLP מתקדם יש שלב נפרד אחרי ה-MVP.
4. **Stack:** Python/FastAPI, Postgres, SQLAlchemy ו-Alembic, worker לסנכרון. ממשק ב-React ו-Vite (RTL, עברית).

## 6. מודל נתונים (לפי §5, §16, §18)

שכבות נפרדות, כפי שנדרש ב-§16:

| שכבה | טבלאות |
|---|---|
| Tenancy | `organizations`, `app_users` (RBAC), `app_audit_log` |
| Connections | `connections` (סוד מוצפן, סטטוס, capabilities שהתגלו), `sync_runs`, `sync_cursors` |
| Raw | `raw_records` (JSONB, מקור ו-stream, retention של 30/90/180 יום) |
| Normalized | `providers`, `products`, `people` + `person_identities`, `sessions`, `activity_events`, `usage_daily`, `cost_daily` (`cost_type: actual \| estimated \| license`), `licenses` |
| Derived | `findings` (Finding, Evidence, Impact, Action, Confidence), `coverage_snapshots` |
| Sensitive | `content_items` (מוצפן, גישה מוגבלת, retention נפרד), `content_detections` |
| Policy | `policies` (§13), `retention_policies` (§17), `tag_rules` |

**Data coverage (§20)** נמדד בפועל ולא רק מוצהר. לכל חיבור ויכולת נשמר: האם הספק תומך, האם ההרשאה קיימת, והאם הנתונים זורמים (מתוך `sync_runs`). מכאן מחושב האחוז שמוצג בפסים.

## 7. תכנית ביצוע

### שלב 1 — מחקר API רשמי (§24), **לפני כל קוד מחברים** (2–3 ימים)
לכל אחד מהמוצרים Claude Enterprise, ChatGPT Enterprise ו-Microsoft 365 Copilot:
- endpoints (method ו-path), ואיזה סוג מפתח או הרשאה כל אחד דורש, ובאיזו תוכנית (Enterprise, Team, API)
- users, usage, cost ועלות רישיונות, sessions, audit, conversation content
- רמת פירוט: לפי משתמש, יום, מודל או session
- pagination, rate limits, webhooks
- מיפוי של כל שדה לשדה ב-Common Model, ורשימת פערים מפורשת

**תוצר:** `research/capabilities/<vendor>.md` וקובץ `capabilities.yaml` אחד, שממנו נגזרות המטריצה בקוד ומסך ה-coverage. כל שורה עם קישור לתיעוד הרשמי.
**בסיום:** המלצה על שני המחברים הראשונים (לפי האפיון: Claude ואחריו ChatGPT) ועל התאמות למודל הנתונים.

### שלב 2 — יסודות הנדסיים (1–2 ימים, במקביל לשלב 1)
- `pyproject.toml`, ruff, mypy, pytest, GitHub Actions
- Docker Compose (api, worker, postgres), `.env.example`
- SQLAlchemy 2 ו-Alembic

### שלב 3 — מודל נתונים ו-ingestion אידמפוטנטי (2–3 ימים)
- הטבלאות מ-§6, upsert ושכבת `raw → normalized` עם בדיקות על fixtures
- **קבלה:** אותו סנכרון פעמיים לא משנה אף מספר.

### שלב 4 — Tenancy, אימות משתמשים ו-credentials (2–3 ימים)
- התחברות למערכת, RBAC בסיסי (admin, analyst, content_reviewer), tenant נגזר מהמשתמש המחובר
- הצפנת סודות (envelope encryption), מפתח ב-KMS או בקובץ לקוח ב-on-prem
- **קבלה:** tenant A לא רואה נתונים של tenant B, ומפתח לא תקין נדחה בשלב החיבור.

### שלב 5 — מסגרת מחברים וסנכרון (2–3 ימים)
- ממשק לפי §6: `authenticate`, `test_connection`, `get_capabilities`, `sync_*`, `get_sync_cursor`, בנוסף ל-`actions()` ריק לעתיד (§15)
- HTTP client משותף עם retry, backoff, `Retry-After`, pagination ו-timeouts
- scheduler, `sync_runs` ותמיכה ב-webhooks אם הספק מציע (§6)
- **קבלה:** סנכרון שנכשל באמצע ממשיך מאותה נקודה, והשגיאה מוצגת ב-UI.

### שלב 6 — מחבר #1: Claude Enterprise (2–3 ימים)
- לפי תוצרי שלב 1, כולל אשף חיבור ב-UI
- **קבלה:** מול חשבון אמיתי, המספרים תואמים לקונסולת Claude.

### שלב 7 — מחבר #2: ChatGPT Enterprise (2–3 ימים)
- לפי תוצרי שלב 1. הקוד הקיים של OpenAI API ישמש מחבר נוסף ל-OpenAI API Platform, אחרי תיקון הבאגים מ-§3.
- **קבלה:** מול חשבון אמיתי, המספרים תואמים ל-ChatGPT Admin או Analytics.

### שלב 8 — דשבורד וניווט (3–4 ימים)
- הניווט לפי §19: Overview, AI Products, Users, Teams, Sessions, Usage, Costs, Insights, Security & Policy, Recommendations, Connections, Settings
- Overview לפי §8, User ו-Department footprint לפי §9, Cost לפי §10 עם סימון ויזואלי של הערכות
- Connections: סטטוס, סנכרון אחרון, יכולות ופסי Data coverage (§20)
- מבנה ארגוני (department, team, cost center) מגיע מ-Entra, Google Directory, SCIM או CSV
- **קבלה:** מנהל לא טכני עונה על "כמה, איפה, מי ומה השתנה" בלי עזרה.

### שלב 9 — Insights ו-Recommendations בסיסיים (2–3 ימים)
- §11: heavy users, רישיונות לא פעילים, מוצרים בניצול נמוך, ו-spikes בשימוש, בעלות וב-tokens
- §14: כל ממצא כולל Finding, Evidence, Impact, Action ו-Confidence
- **קבלה:** לכל כלל יש בדיקה עם fixture שמפעיל אותו ו-fixture שלא מפעיל אותו.

**כאן מסתיים ה-MVP לפי §22.**

### שלב 10 — מחבר #3: Microsoft 365 Copilot (3–4 ימים)
- OAuth ו-admin consent, Graph reports ורישיונות. אינטראקציות ו-audit לפי תוצרי המחקר.

### שלב 11 — Security & Policy: תוכן ו-PII (§13) (5–7 ימים)
- רק כשהספק חושף תוכן דרך API רשמי, והלקוח הפעיל את האיסוף לחיבור הזה
- זיהוי PII, credentials, secrets וקוד מקור: Presidio (מקומי), בתוספת recognizers לישראל (ת"ז עם ספרת ביקורת, טלפון, IBAN, כרטיס אשראי עם Luhn)
- מנוע policies (§13): "PII may not be sent to external AI systems", והממצא ברמת session
- תצוגה מושחרת כברירת מחדל. תוכן מלא מוצג רק ל-`content_reviewer`, וכל צפייה נרשמת ב-audit
- retention לפי §17: תוכן כבוי כברירת מחדל ומחיקה לפי מדיניות
- Data available מול Data analyzed מוצגים לכל חיבור

### שלב 12 — Duplicate / Overlapping Work (§12)
- embeddings ו-semantic similarity על תוכן זמין, ברמת משתמש וברמת צוות, כהמלצה בלבד

### שלב 13 — הרחבות והקשחה
- מחברים ל-Gemini, GitHub Copilot ו-Cursor (§7)
- SSO/SAML, SCIM ו-tenant policies (§18)
- ניטור, גיבויים, rate limiting וסריקת תלויות

**הערכה:** MVP (שלבים 1–9) לוקח כ-4 שבועות. עם Microsoft ותוכן ו-PII זה כ-6–7 שבועות, לפי מה שהמחקר בשלב 1 יגלה.

## 8. מחוץ לתחום (§21, §22)

AI Gateway, proxy, model router, prompt firewall, EDR, ניטור דפדפן, SIEM כללי, FinOps כללי, Discovery ו-Shadow AI (Product B), ואכיפה אוטומטית.
