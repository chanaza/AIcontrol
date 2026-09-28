// Deterministic demo organization ("נובה תעשיות", fictional). Every finding below is
// derived from, or consistent with, the generated records so evidence tables add up.

import type {
  ApiKey, AuditEvent, Connection, ContentDetection, DailyPoint, Department, Finding,
  License, LiveEvent, Person, PersonUsage, PostureCheck, Product,
} from "./types";

export const TODAY = new Date(Date.UTC(2026, 8, 28));
export const ORG_NAME = "נובה תעשיות";
export const ORG_DOMAIN = "nova.co.il";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260928);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const int = (lo: number, hi: number) => Math.floor(between(lo, hi + 1));

export const isoDay = (daysAgo: number) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};
const isoAt = (daysAgo: number, hh: number, mm: number) => `${isoDay(daysAgo)}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`;

export const products: Product[] = [
  { id: "chatgpt", name: "ChatGPT Enterprise", vendor: "OpenAI", category: "chat", billing: "seat", seatPrice: 60, seats: 320, approved: "approved", color: "var(--p1)", consoleUrl: "https://chatgpt.com/admin" },
  { id: "claude", name: "Claude Enterprise", vendor: "Anthropic", category: "chat", billing: "seat", seatPrice: 60, seats: 180, approved: "approved", color: "var(--p2)", consoleUrl: "https://claude.ai/admin-settings" },
  { id: "m365", name: "Microsoft 365 Copilot", vendor: "Microsoft", category: "chat", billing: "seat", seatPrice: 30, seats: 400, approved: "approved", color: "var(--p3)", consoleUrl: "https://admin.microsoft.com" },
  { id: "ghcopilot", name: "GitHub Copilot Business", vendor: "GitHub", category: "code", billing: "seat", seatPrice: 19, seats: 150, approved: "approved", color: "var(--p4)", consoleUrl: "https://github.com/organizations/nova-industries/settings/copilot" },
  { id: "cursor", name: "Cursor Business", vendor: "Anysphere", category: "code", billing: "seat", seatPrice: 40, seats: 60, approved: "review", color: "var(--p5)", consoleUrl: "https://cursor.com/dashboard" },
  { id: "openai-api", name: "OpenAI API", vendor: "OpenAI", category: "api", billing: "usage", approved: "approved", color: "var(--p6)", consoleUrl: "https://platform.openai.com/settings/organization/general" },
  { id: "anthropic-api", name: "Claude API ו-Claude Code", vendor: "Anthropic", category: "api", billing: "usage", approved: "approved", color: "var(--p7)", consoleUrl: "https://console.anthropic.com/settings/keys" },
];
export const productById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;

export const departments: Department[] = [
  { id: "rnd", name: "פיתוח", costCenter: "CC-100", headcount: 180, monthlyBudget: 21000 },
  { id: "data", name: "דאטה ו-AI", costCenter: "CC-110", headcount: 40, monthlyBudget: 9000 },
  { id: "product", name: "מוצר", costCenter: "CC-120", headcount: 35, monthlyBudget: 4200 },
  { id: "marketing", name: "שיווק", costCenter: "CC-200", headcount: 45, monthlyBudget: 4500 },
  { id: "sales", name: "מכירות", costCenter: "CC-210", headcount: 90, monthlyBudget: 6500 },
  { id: "support", name: "תמיכה ושירות", costCenter: "CC-220", headcount: 80, monthlyBudget: 6000 },
  { id: "finance", name: "כספים", costCenter: "CC-300", headcount: 30, monthlyBudget: 2600 },
  { id: "hr", name: "משאבי אנוש", costCenter: "CC-310", headcount: 25, monthlyBudget: 1800 },
  { id: "legal", name: "משפטית", costCenter: "CC-320", headcount: 15, monthlyBudget: 1800 },
  { id: "it", name: "IT ואבטחת מידע", costCenter: "CC-400", headcount: 30, monthlyBudget: 3200 },
];
export const deptById = Object.fromEntries(departments.map((d) => [d.id, d])) as Record<string, Department>;

const FIRST = [
  ["יונתן", "yonatan"], ["נועה", "noa"], ["איתי", "itai"], ["מיכל", "michal"], ["עומר", "omer"], ["תמר", "tamar"],
  ["דניאל", "daniel"], ["שירה", "shira"], ["אורי", "uri"], ["יעל", "yael"], ["רועי", "roy"], ["הדס", "hadas"],
  ["אביב", "aviv"], ["מאיה", "maya"], ["גיא", "guy"], ["רוני", "roni"], ["עידו", "ido"], ["ליאור", "lior"],
  ["נדב", "nadav"], ["שני", "shani"], ["אלון", "alon"], ["טל", "tal"], ["עמית", "amit"], ["קרן", "keren"],
  ["ברק", "barak"], ["ענבל", "inbal"], ["יואב", "yoav"], ["דנה", "dana"], ["אסף", "asaf"], ["רותם", "rotem"],
  ["ניר", "nir"], ["אורית", "orit"], ["שחר", "shahar"], ["הילה", "hila"], ["אריאל", "ariel"], ["סיון", "sivan"],
  ["בועז", "boaz"], ["משה", "moshe"], ["רחל", "rachel"], ["דוד", "david"], ["אסתר", "ester"], ["יוסף", "yosef"],
  ["חנה", "hana"], ["מרדכי", "mordechai"], ["מירב", "merav"], ["אליעזר", "eliezer"], ["נחמה", "nechama"], ["אהרון", "aharon"],
];
const LAST = [
  ["כהן", "cohen"], ["לוי", "levi"], ["מזרחי", "mizrahi"], ["פרץ", "peretz"], ["ביטון", "biton"], ["אברהם", "avraham"],
  ["פרידמן", "friedman"], ["שפירא", "shapira"], ["אזולאי", "azulay"], ["דהן", "dahan"], ["גבאי", "gabay"], ["קליין", "klein"],
  ["רוזן", "rosen"], ["שטרן", "stern"], ["גולן", "golan"], ["חדד", "hadad"], ["אלמוג", "almog"], ["נחום", "nachum"],
  ["סלע", "sela"], ["הלוי", "halevi"], ["וייס", "weiss"], ["אשכנזי", "ashkenazi"], ["שגיא", "sagi"], ["עמר", "amar"],
  ["רבינוביץ", "rabinovich"], ["בן דוד", "bendavid"], ["טל", "tal"], ["ברגר", "berger"], ["נגר", "nagar"], ["קפלן", "kaplan"],
];
const TEAMS: Record<string, string[]> = {
  rnd: ["Backend", "Frontend", "Mobile", "Platform", "QA"], data: ["ML", "BI", "Data Eng"], product: ["PM", "UX"],
  marketing: ["תוכן", "Performance", "מיתוג"], sales: ["EMEA", "ישראל", "Enterprise"], support: ["Tier 1", "Tier 2", "הצלחת לקוח"],
  finance: ["חשבות", "FP&A"], hr: ["גיוס", "רווחה"], legal: ["חוזים", "רגולציה"], it: ["תשתיות", "אבטחת מידע", "Helpdesk"],
};
const ROLES: Record<string, string[]> = {
  rnd: ["מפתח/ת", "מפתח/ת בכיר/ה", "ראש צוות"], data: ["Data Scientist", "Data Engineer", "אנליסט/ית"], product: ["מנהל/ת מוצר", "מעצב/ת UX"],
  marketing: ["מנהל/ת קמפיינים", "כותב/ת תוכן"], sales: ["איש/אשת מכירות", "מנהל/ת לקוחות"], support: ["נציג/ת שירות", "ראש משמרת"],
  finance: ["חשב/ת", "אנליסט/ית כספים"], hr: ["רכז/ת גיוס", "HRBP"], legal: ["עו\"ד", "יועץ/ת רגולציה"], it: ["מהנדס/ת מערכות", "אנליסט/ית SOC"],
};

export const people: Person[] = [];
{
  const used = new Set<string>();
  let n = 0;
  for (const d of departments) {
    for (let i = 0; i < d.headcount; i++) {
      let f: string[], l: string[], key: string;
      do { f = pick(FIRST); l = pick(LAST); key = f[1] + "." + l[1]; } while (used.has(key) && used.size < FIRST.length * LAST.length);
      if (used.has(key)) key = `${key}${n}`;
      used.add(key);
      people.push({
        id: `u${++n}`, name: `${f[0]} ${l[0]}`, email: `${key}@${ORG_DOMAIN}`, deptId: d.id,
        team: pick(TEAMS[d.id]), role: pick(ROLES[d.id]), status: "active",
      });
    }
  }
  // Nine leavers in the last two months; several keep AI access (finding S2).
  const leavers = [3, 41, 77, 150, 199, 230, 301, 388, 455];
  leavers.forEach((idx, i) => { people[idx].status = "offboarded"; people[idx].offboardedAt = isoDay(8 + i * 5); });
}
export const personById = Object.fromEntries(people.map((p) => [p.id, p])) as Record<string, Person>;

const activeIn = (dept: string, k: number) => people.filter((p) => p.deptId === dept && p.status === "active")[k].id;
// Named people that the scenario refers to; resolved from the generated org so every reference exists.
export const R = {
  pii: activeIn("support", 20), rndLead: activeIn("rnd", 11), sales: activeIn("sales", 12), finance: activeIn("finance", 3),
  legal: activeIn("legal", 1), rndDev: activeIn("rnd", 40), phones: activeIn("support", 30), extAdder: activeIn("product", 7),
  itAdmin: activeIn("it", 0), mktOwner: activeIn("marketing", 3), leaver: people.find((p) => p.status === "offboarded")!.id,
  m365Admin: activeIn("it", 2), ghAdmin: activeIn("rnd", 5), supportBot: activeIn("support", 2), supportOwner: activeIn("support", 4),
  dataEng: activeIn("data", 2),
};

const eligible: Record<string, (p: Person) => number> = {
  chatgpt: (p) => ({ marketing: 0.9, sales: 0.8, support: 0.55, product: 0.8, finance: 0.6, hr: 0.7, legal: 0.5, it: 0.4, rnd: 0.3, data: 0.5 } as Record<string, number>)[p.deptId],
  claude: (p) => ({ rnd: 0.45, data: 0.85, product: 0.6, legal: 0.8, marketing: 0.3, it: 0.3 } as Record<string, number>)[p.deptId] ?? 0.05,
  m365: () => 0.72,
  ghcopilot: (p) => ({ rnd: 0.75, data: 0.35, it: 0.2 } as Record<string, number>)[p.deptId] ?? 0,
  cursor: (p) => ({ rnd: 0.3, data: 0.2 } as Record<string, number>)[p.deptId] ?? 0,
};
const inactiveRate: Record<string, number> = { chatgpt: 0.11, claude: 0.07, m365: 0.24, ghcopilot: 0.09, cursor: 0.04 };

export const licenses: License[] = [];
for (const prod of products.filter((p) => p.billing === "seat")) {
  const scored = people.map((p) => ({ p, s: rand() - (eligible[prod.id](p) ?? 0) })).sort((a, b) => a.s - b.s);
  for (const { p } of scored.slice(0, prod.seats!)) {
    const inactive = rand() < inactiveRate[prod.id] || (p.status === "offboarded" && rand() < 0.8);
    const lastActive = p.status === "offboarded"
      ? Math.max(0, Math.round((TODAY.getTime() - Date.parse(p.offboardedAt!)) / 864e5) + int(0, 3))
      : inactive ? (rand() < 0.35 ? null : int(31, 88)) : int(0, 9);
    licenses.push({ personId: p.id, productId: prod.id, assignedAt: isoDay(int(95, 400)), lastActiveDaysAgo: lastActive });
  }
}
// Make sure a handful of leavers still show recent activity after their exit date.
licenses.filter((l) => personById[l.personId].status === "offboarded").slice(0, 3).forEach((l) => { l.lastActiveDaysAgo = int(1, 4); });

export const licensesByPerson = new Map<string, License[]>();
for (const l of licenses) licensesByPerson.set(l.personId, [...(licensesByPerson.get(l.personId) ?? []), l]);

export const personUsage: PersonUsage[] = [];
for (const l of licenses) {
  const prod = productById[l.productId];
  const active = l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30;
  const intensity = active ? Math.pow(rand(), 1.8) : 0;
  const sessions = active ? Math.round(4 + intensity * (prod.category === "code" ? 260 : 140)) : 0;
  const tokens = prod.id === "m365" ? 0 : Math.round(sessions * between(2500, 9000));
  personUsage.push({ personId: l.personId, productId: l.productId, sessions30: sessions, tokens30: tokens, cost30: prod.seatPrice!, costType: "license" });
}

export const apiKeys: ApiKey[] = [
  { id: "k1", productId: "openai-api", name: "proj-support-bot", ownerId: R.supportBot, createdDaysAgo: 210, lastUsedDaysAgo: 0, cost30: 3120, scope: "All permissions" },
  { id: "k2", productId: "openai-api", name: "proj-marketing-gen", ownerId: R.mktOwner, createdDaysAgo: 64, lastUsedDaysAgo: 0, cost30: 4480, scope: "All permissions" },
  { id: "k3", productId: "openai-api", name: "etl-enrichment", ownerId: R.dataEng, createdDaysAgo: 402, lastUsedDaysAgo: 1, cost30: 910, scope: "Restricted: models, files" },
  { id: "k4", productId: "openai-api", name: "legacy-search", ownerId: R.leaver, createdDaysAgo: 540, lastUsedDaysAgo: 2, cost30: 640, scope: "All permissions" },
  { id: "k5", productId: "anthropic-api", name: "claude-code-rnd", ownerId: R.rndLead, createdDaysAgo: 150, lastUsedDaysAgo: 0, cost30: 3950, scope: "Workspace: Engineering" },
  { id: "k6", productId: "anthropic-api", name: "support-classifier", ownerId: R.supportOwner, createdDaysAgo: 120, lastUsedDaysAgo: 0, cost30: 2210, scope: "Workspace: Support" },
  { id: "k7", productId: "anthropic-api", name: "contract-review", ownerId: R.legal, createdDaysAgo: 88, lastUsedDaysAgo: 3, cost30: 380, scope: "Workspace: Legal" },
  { id: "k8", productId: "anthropic-api", name: "hackathon-2025", ownerId: null, createdDaysAgo: 365, lastUsedDaysAgo: 6, cost30: 290, scope: "Workspace: Default" },
];
// Key owners of API projects get attributed actual cost in their footprint.
for (const k of apiKeys) {
  if (!k.ownerId) continue;
  personUsage.push({ personId: k.ownerId, productId: k.productId, sessions30: int(40, 400), tokens30: Math.round(k.cost30 * between(90_000, 160_000)), cost30: k.cost30, costType: "actual" });
}

export const daily: DailyPoint[] = [];
for (let d = 89; d >= 0; d--) {
  const date = isoDay(d);
  const dow = new Date(date).getUTCDay();
  const weekday = dow === 5 || dow === 6 ? 0.28 : 1; // Israeli weekend: Friday and Saturday
  const growth = 1 + (89 - d) * 0.0042;
  for (const prod of products) {
    if (prod.billing === "seat") {
      const lic = licenses.filter((l) => l.productId === prod.id);
      const activeBase = lic.filter((l) => l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30).length;
      const adoption = prod.id === "m365" ? 0.42 : prod.id === "cursor" ? 0.85 : 0.62;
      const au = Math.round(activeBase * adoption * weekday * growth * between(0.93, 1.05));
      const perUser = prod.category === "code" ? between(9, 13) : between(4, 7);
      const sessions = Math.round(au * perUser);
      daily.push({ date, productId: prod.id, activeUsers: au, sessions, tokens: prod.id === "m365" ? 0 : Math.round(sessions * between(3500, 6000)), cost: (prod.seats! * prod.seatPrice!) / 30, costType: "license" });
    } else {
      const base = prod.id === "openai-api" ? 255 : 150 + (89 - d) * 1.9;
      const spike = prod.id === "openai-api" && d >= 12 && d <= 16 ? between(2.6, 3.4) : 1;
      const cost = base * (0.55 + weekday * 0.45) * growth * spike * between(0.9, 1.1);
      daily.push({ date, productId: prod.id, activeUsers: Math.round((prod.id === "openai-api" ? 14 : 46) * weekday * growth), sessions: Math.round(cost * 38), tokens: Math.round(cost * 120_000), cost, costType: "actual" });
    }
  }
}

export const postureChecks: PostureCheck[] = [
  { id: "sso", name: "SSO נאכף לכל המשתמשים", description: "התחברות רק דרך ספק הזהות הארגוני, בלי סיסמה מקומית", results: { chatgpt: "pass", claude: "pass", m365: "pass", ghcopilot: "pass", cursor: "fail", "openai-api": "fail", "anthropic-api": "pass" } },
  { id: "domain", name: "אימות דומיין ו-JIT provisioning", description: "רק כתובות בדומיין הארגוני יכולות להצטרף ל-workspace", results: { chatgpt: "pass", claude: "fail", m365: "pass", ghcopilot: "na", cursor: "unknown", "openai-api": "na", "anthropic-api": "na" } },
  { id: "retention", name: "מדיניות שמירת נתונים מוגדרת", description: "תקופת שמירה של שיחות תואמת את מדיניות הארגון (90 יום)", results: { chatgpt: "fail", claude: "pass", m365: "pass", ghcopilot: "na", cursor: "unknown", "openai-api": "pass", "anthropic-api": "pass" } },
  { id: "training", name: "הנתונים לא משמשים לאימון מודלים", description: "הסכם ארגוני או הגדרה שמונעת אימון על נתוני הארגון", results: { chatgpt: "pass", claude: "pass", m365: "pass", ghcopilot: "pass", cursor: "fail", "openai-api": "pass", "anthropic-api": "pass" } },
  { id: "sharing", name: "שיתוף ציבורי כבוי", description: "אין שיתוף ציבורי של שיחות, GPTs או פרויקטים מחוץ לארגון", results: { chatgpt: "fail", claude: "pass", m365: "pass", ghcopilot: "na", cursor: "na", "openai-api": "na", "anthropic-api": "na" } },
  { id: "thirdparty", name: "אינטגרציות צד שלישי מאושרות בלבד", description: "Connectors, GPTs ותוספים חיצוניים דורשים אישור מנהל", results: { chatgpt: "fail", claude: "pass", m365: "unknown", ghcopilot: "pass", cursor: "unknown", "openai-api": "na", "anthropic-api": "na" } },
  { id: "keys", name: "מפתחות API עם הרשאות מוגבלות", description: "אין מפתחות עם הרשאה מלאה שלא בשימוש שירות מוגדר", results: { chatgpt: "na", claude: "na", m365: "na", ghcopilot: "na", cursor: "na", "openai-api": "fail", "anthropic-api": "pass" } },
  { id: "admins", name: "מספר מנהלים מינימלי", description: "לא יותר מ-3 בעלי הרשאת מנהל ב-workspace", results: { chatgpt: "pass", claude: "fail", m365: "pass", ghcopilot: "pass", cursor: "pass", "openai-api": "pass", "anthropic-api": "pass" } },
  { id: "audit", name: "יומן audit זמין ומחובר", description: "המערכת מקבלת את יומן הפעולות של הכלי", results: { chatgpt: "pass", claude: "pass", m365: "pass", ghcopilot: "pass", cursor: "fail", "openai-api": "pass", "anthropic-api": "pass" } },
];

const who = (id: string) => personById[id].name;
export const auditEvents: AuditEvent[] = [
  { id: "a1", at: isoAt(0, 2, 14), productId: "claude", actor: who(R.extAdder), action: "הוספת מנהל ארגון", target: "ext.consultant@gmail.com", anomalous: true, reason: "שעה חריגה (02:14), היעד מחוץ לדומיין, והמבצע לא מנהל IT" },
  { id: "a2", at: isoAt(0, 9, 3), productId: "chatgpt", actor: who(R.itAdmin), action: "שינוי הגדרת שמירת נתונים", target: "Retention: 90 → ללא הגבלה", anomalous: true, reason: "שינוי בהגדרת אבטחה בלי כרטיס שינוי מקושר" },
  { id: "a3", at: isoAt(1, 16, 40), productId: "openai-api", actor: who(R.mktOwner), action: "יצירת מפתח API", target: "proj-marketing-gen-2 (All permissions)", anomalous: true, reason: "מפתח עם הרשאה מלאה, ומשתמש שאינו מפתח" },
  { id: "a4", at: isoAt(2, 11, 20), productId: "chatgpt", actor: who(R.itAdmin), action: "הפעלת GPT צד שלישי", target: "PDF Master Pro", anomalous: false },
  { id: "a5", at: isoAt(3, 23, 51), productId: "chatgpt", actor: who(R.leaver), action: "ייצוא שיחות", target: "412 שיחות (ZIP)", anomalous: true, reason: "ייצוא מסיבי 3 ימים לפני תאריך עזיבה" },
  { id: "a6", at: isoAt(4, 10, 5), productId: "m365", actor: who(R.m365Admin), action: "הקצאת רישיונות", target: "25 רישיונות Copilot", anomalous: false },
  { id: "a7", at: isoAt(5, 14, 32), productId: "ghcopilot", actor: who(R.ghAdmin), action: "שינוי מדיניות", target: "Suggestions matching public code: Allowed", anomalous: true, reason: "הגדרה שמגבירה סיכון רישוי קוד" },
  { id: "a8", at: isoAt(6, 8, 55), productId: "anthropic-api", actor: who(R.rndLead), action: "העלאת מגבלת הוצאה", target: "Workspace Engineering: $3K → $8K", anomalous: false },
  { id: "a9", at: isoAt(7, 12, 0), productId: "claude", actor: who(R.legal), action: "הזמנת משתמשים", target: "3 משתמשים", anomalous: false },
];

export const detections: ContentDetection[] = [
  { id: "d1", at: isoAt(0, 10, 12), productId: "chatgpt", personId: R.pii, sessionId: "cg-8f21a", entity: "מספר תעודת זהות", count: 38, snippet: "…רשימת לקוחות לבדיקה: ת\"ז ███████29, ███████17, …", policy: "PII אסור בכלים חיצוניים" },
  { id: "d2", at: isoAt(0, 8, 47), productId: "claude", personId: R.rndLead, sessionId: "cl-19c0e", entity: "מפתח AWS", count: 1, snippet: "…export AWS_SECRET_ACCESS_KEY=████████████████…", policy: "אין להדביק סודות וקוד תשתית" },
  { id: "d3", at: isoAt(1, 15, 30), productId: "chatgpt", personId: R.sales, sessionId: "cg-7d02b", entity: "כרטיס אשראי", count: 6, snippet: "…החיוב נכשל בכרטיסים ████ ████ ████ 4417…", policy: "PII אסור בכלים חיצוניים" },
  { id: "d4", at: isoAt(2, 13, 5), productId: "m365", personId: R.finance, sessionId: "m3-551aa", entity: "מספר חשבון בנק", count: 12, snippet: "…סניף 6██ חשבון ███████, סניף 1██…" },
  { id: "d5", at: isoAt(2, 9, 18), productId: "claude", personId: R.legal, sessionId: "cl-22f9d", entity: "מסמך מסווג \"סודי\"", count: 1, snippet: "…הסכם מיזוג — טיוטה — סודי ביותר…", policy: "מסמכים מסווגים רק ב-workspace משפטי" },
  { id: "d6", at: isoAt(3, 17, 44), productId: "chatgpt", personId: R.rndDev, sessionId: "cg-0a9e4", entity: "קוד מקור", count: 1, snippet: "…class PaymentGateway { private readonly apiSecret = …", policy: "קוד מקור רק בכלי קוד מאושרים" },
  { id: "d7", at: isoAt(5, 11, 2), productId: "chatgpt", personId: R.phones, sessionId: "cg-3bb71", entity: "מספר טלפון", count: 140, snippet: "…052-██████8, 054-██████1, 050-██████3…", policy: "PII אסור בכלים חיצוניים" },
];

export const connections: Connection[] = [
  { productId: "claude", status: "healthy", authMethod: "Admin API key + Compliance API", lastSyncMinutesAgo: 3, freshness: "3 דקות", vendorLatency: "audit כמעט בזמן אמת · usage יומי", coverage: { users: 100, usage: 100, cost: 80, sessions: 90, audit: 100, content: 100 }, contentEnabled: true },
  { productId: "chatgpt", status: "healthy", authMethod: "Admin key + Compliance API", lastSyncMinutesAgo: 4, freshness: "4 דקות", vendorLatency: "audit ו-compliance תוך דקות · analytics יומי", coverage: { users: 100, usage: 90, cost: 60, sessions: 80, audit: 100, content: 100 }, contentEnabled: true },
  { productId: "m365", status: "healthy", authMethod: "OAuth (Entra ID) · admin consent", lastSyncMinutesAgo: 11, freshness: "11 דקות", vendorLatency: "אינטראקציות תוך שעות · דוחות usage באיחור של 48 שעות", coverage: { users: 100, usage: 70, cost: 60, sessions: 60, audit: 100, content: 70 }, contentEnabled: true },
  { productId: "ghcopilot", status: "healthy", authMethod: "GitHub App", lastSyncMinutesAgo: 22, freshness: "22 דקות", vendorLatency: "metrics יומי · audit תוך דקות", coverage: { users: 100, usage: 80, cost: 100, sessions: 0, audit: 100, content: 0 }, contentEnabled: false },
  { productId: "cursor", status: "degraded", authMethod: "Admin API key", lastSyncMinutesAgo: 1860, freshness: "31 שעות", vendorLatency: "usage יומי", coverage: { users: 100, usage: 60, cost: 50, sessions: 0, audit: 0, content: 0 }, contentEnabled: false, missing: "הסנכרון האחרון נכשל (HTTP 401): המפתח בוטל או שפג תוקפו" },
  { productId: "openai-api", status: "healthy", authMethod: "Admin API key", lastSyncMinutesAgo: 6, freshness: "6 דקות", vendorLatency: "usage ו-costs בדליים של דקה עד יום", coverage: { users: 100, usage: 100, cost: 100, sessions: 0, audit: 100, content: 0 }, contentEnabled: false, missing: "תוכן קריאות API לא נחשף על ידי הספק" },
  { productId: "anthropic-api", status: "healthy", authMethod: "Admin API key", lastSyncMinutesAgo: 5, freshness: "5 דקות", vendorLatency: "usage ו-cost report · Claude Code analytics יומי", coverage: { users: 100, usage: 100, cost: 100, sessions: 50, audit: 60, content: 0 }, contentEnabled: false, missing: "תוכן קריאות API לא נחשף על ידי הספק" },
];

// ---------- Findings, computed from the records above ----------

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const days = (n: number | null) => (n === null ? "מעולם לא" : n === 0 ? "היום" : `לפני ${n} ימים`);
const deptName = (pid: string) => deptById[personById[pid].deptId].name;

function inactiveLicenseFinding(productId: string, id: string, severity: Finding["severity"]): Finding {
  const prod = productById[productId];
  const idle = licenses.filter((l) => l.productId === productId && personById[l.personId].status === "active" && (l.lastActiveDaysAgo === null || l.lastActiveDaysAgo > 30));
  const byDept = new Map<string, number>();
  idle.forEach((l) => byDept.set(personById[l.personId].deptId, (byDept.get(personById[l.personId].deptId) ?? 0) + 1));
  const topDept = [...byDept.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    id, ruleId: "C1", ruleName: "רישיונות לא פעילים", category: "cost", severity,
    title: `${idle.length} רישיונות ${prod.name} לא נוצלו ביותר מ-30 יום`,
    summary: `${idle.length} מתוך ${prod.seats} המושבים המשולמים לא היו פעילים החודש. הריכוז הגבוה ביותר במחלקת ${deptById[topDept[0]].name} (${topDept[1]}).`,
    productIds: [productId], deptIds: [...byDept.keys()], personIds: idle.map((l) => l.personId),
    detectedAt: isoAt(0, 6, 0), status: "open",
    owner: { name: "מנהל/ת רישוי SaaS", role: "IT" },
    impact: { usdMonthly: idle.length * prod.seatPrice!, users: idle.length },
    confidence: 0.93, coverageNote: `מבוסס על נתוני פעילות למשתמש מ-${prod.vendor} (כיסוי users ו-usage).`,
    evidence: {
      columns: ["משתמש", "מחלקה", "הוקצה", "פעילות אחרונה", "עלות חודשית"],
      rows: idle.sort((a, b) => (b.lastActiveDaysAgo ?? 999) - (a.lastActiveDaysAgo ?? 999)).map((l) => [personById[l.personId].name, deptName(l.personId), l.assignedAt, days(l.lastActiveDaysAgo), usd(prod.seatPrice!)]),
    },
    remediation: {
      steps: [
        "לייצא את רשימת המשתמשים (כפתור ייצוא בטבלה) ולשלוח למנהלי המחלקות לאישור.",
        "לשלוח למשתמשים הודעה עם אפשרות לבקש להשאיר את הרישיון (נוסח מוכן למטה).",
        `אחרי 7 ימים ללא תגובה, להסיר את הרישיונות ב-${prod.name}.`,
        "להקטין את מספר המושבים בחוזה בחידוש הקרוב.",
      ],
      consoleUrl: prod.consoleUrl, consoleLabel: `ניהול משתמשים ב-${prod.name}`,
    },
    message: `שלום,\nלפי נתוני השימוש, לא השתמשת ב-${prod.name} ב-30 הימים האחרונים. אנחנו מפנים רישיונות שלא בשימוש.\nאם הכלי חשוב לעבודתך, השב/י להודעה זו עד יום ראשון ונשאיר את הרישיון.\nתודה, צוות IT`,
    verification: "בסנכרון הבא המערכת תבדוק שמספר המושבים הלא פעילים ירד, ותסגור את הממצא אוטומטית.",
  };
}

const offboardedWithAccess = licenses.filter((l) => personById[l.personId].status === "offboarded");
const overlap = people.filter((p) => {
  const chat = (licensesByPerson.get(p.id) ?? []).filter((l) => productById[l.productId].category === "chat" && l.productId !== "m365");
  return chat.length >= 2 && p.status === "active";
});
const overlapLowUse = overlap.filter((p) => {
  const u = personUsage.filter((x) => x.personId === p.id && (x.productId === "chatgpt" || x.productId === "claude"));
  return u.some((x) => x.sessions30 < 8);
});
const codeOverlap = people.filter((p) => {
  const ids = (licensesByPerson.get(p.id) ?? []).map((l) => l.productId);
  return ids.includes("ghcopilot") && ids.includes("cursor");
});

const spikeDays = daily.filter((d) => d.productId === "openai-api" && d.date >= isoDay(16) && d.date <= isoDay(12));
const baseline = daily.filter((d) => d.productId === "openai-api" && d.date >= isoDay(44) && d.date < isoDay(16));
const baseAvg = baseline.reduce((s, d) => s + d.cost, 0) / baseline.length;
const spikeExtra = spikeDays.reduce((s, d) => s + d.cost - baseAvg, 0);

const deptForecast = (deptId: string) => {
  const ppl = people.filter((p) => p.deptId === deptId).map((p) => p.id);
  return personUsage.filter((u) => ppl.includes(u.personId)).reduce((s, u) => s + u.cost30, 0);
};
const overBudget = departments.map((d) => ({ d, f: deptForecast(d.id) })).filter((x) => x.f > x.d.monthlyBudget).sort((a, b) => b.f / b.d.monthlyBudget - a.f / a.d.monthlyBudget);

const heavy = personUsage.filter((u) => u.productId === "anthropic-api" || u.productId === "chatgpt").sort((a, b) => b.tokens30 - a.tokens30).slice(0, 5);

export const findings: Finding[] = [
  {
    id: "F-1041", ruleId: "S6", ruleName: "PII בתוכן שיחות", category: "security", severity: "critical", realtime: true,
    title: "38 מספרי תעודת זהות הודבקו לשיחה ב-ChatGPT Enterprise",
    summary: `${who(R.pii)} (${deptName(R.pii)}) הדביק/ה רשימת לקוחות עם 38 מספרי ת"ז תקינים (ספרת ביקורת עברה) לשיחה אחת, בניגוד למדיניות "PII אסור בכלים חיצוניים".`,
    productIds: ["chatgpt"], deptIds: [personById[R.pii].deptId], personIds: [R.pii], detectedAt: isoAt(0, 10, 14), status: "open",
    owner: { name: "אבטחת מידע", role: "CISO" }, impact: { risk: "חשיפת מידע אישי של 38 לקוחות לספק חיצוני", users: 1 },
    confidence: 0.97, coverageNote: "מבוסס על Compliance API של ChatGPT Enterprise. איסוף התוכן הופעל על ידי הארגון.",
    evidence: { columns: ["זמן", "Session", "ישות", "כמות", "קטע (מושחר)"], rows: [["28/09 10:12", "cg-8f21a", "ת\"ז (Luhn/ספרת ביקורת)", 38, "ת\"ז ███████29, ███████17, ███████02 …"], ["28/09 10:13", "cg-8f21a", "שם מלא", 38, "משה ██████, רחל ██████ …"]] },
    remediation: { steps: ["לפנות למשתמש/ת ולברר את מקור הרשימה ואת מטרת השימוש.", "למחוק את השיחה דרך Compliance API או מסך ה-Admin של ChatGPT (מחיקה נרשמת ב-audit).", "לבדוק אם נדרש דיווח לפי תקנות הגנת הפרטיות (אבטחת מידע), ולתעד את ההחלטה.", "להדריך את מחלקת המשתמש/ת. חלופה מאושרת: כלי פנימי עם נתונים מותממים."], consoleUrl: "https://chatgpt.com/admin", consoleLabel: "ChatGPT Admin · Conversations" },
    message: `שלום,\nזיהינו שבשיחה ב-ChatGPT ב-28/09 בשעה 10:12 הודבקה רשימה שכוללת מספרי תעודת זהות של לקוחות.\nמדיניות הארגון אוסרת העברת מידע אישי לכלי AI חיצוניים. נשמח לשיחה קצרה היום כדי להבין את הצורך ולמצוא חלופה מאושרת.\nצוות אבטחת מידע`,
    verification: "הממצא ייסגר אחרי סימון 'טופל' ואימות שהשיחה נמחקה (אירוע מחיקה ביומן ה-audit).",
  },
  {
    id: "F-1040", ruleId: "S4", ruleName: "פעולת מנהל חריגה", category: "security", severity: "critical", realtime: true,
    title: "מנהל ארגון חיצוני נוסף ל-Claude Enterprise בשעה 02:14",
    summary: `${who(R.extAdder)} (${deptName(R.extAdder)}) הוסיף/ה את ext.consultant@gmail.com כמנהל ארגון. זו כתובת מחוץ לדומיין, בשעה חריגה, והמבצע/ת אינו/ה בצוות IT.`,
    productIds: ["claude"], deptIds: [personById[R.extAdder].deptId], personIds: [R.extAdder], detectedAt: isoAt(0, 2, 17), status: "open",
    owner: { name: "אבטחת מידע", role: "SOC" }, impact: { risk: "גישת מנהל מלאה לכל השיחות, הפרויקטים וההגדרות בארגון" },
    confidence: 0.9, coverageNote: "מבוסס על יומן ה-audit של Claude Enterprise, שנקלט כמעט בזמן אמת.",
    evidence: { columns: ["זמן", "מבצע", "פעולה", "יעד", "IP / מיקום"], rows: [["28/09 02:14", who(R.extAdder), "Add member (role: Owner)", "ext.consultant@gmail.com", "185.220.xx.xx · הולנד"], ["28/09 02:16", "ext.consultant@gmail.com", "Login", "—", "185.220.xx.xx · הולנד"], ["28/09 02:21", "ext.consultant@gmail.com", "View organization settings", "Data retention", "185.220.xx.xx · הולנד"]] },
    remediation: { steps: ["לאמת מול המבצע/ת בערוץ נפרד (טלפון) שהפעולה אכן בוצעה על ידו/ה.", "אם לא: להסיר מיד את המשתמש החיצוני, לאפס את פרטי ההתחברות של המבצע/ת ולפתוח אירוע אבטחה.", "לבדוק ביומן אילו נתונים נצפו או יוצאו מאז 02:14.", "לצמצם את מספר המנהלים ל-3 לכל היותר (בדיקת posture 'מספר מנהלים מינימלי' נכשלת)."], consoleUrl: "https://claude.ai/admin-settings", consoleLabel: "Claude Admin · Members" },
    message: `שלום,\nביומן של Claude Enterprise מופיע שבשעה 02:14 הוספת את ext.consultant@gmail.com כמנהל ארגון.\nנבקש לאשר בהקדם, בטלפון לצוות אבטחת המידע, שהפעולה בוצעה על ידך ולאיזו מטרה.`,
    verification: "המערכת תבדוק בסנכרון הבא שהמשתמש החיצוני הוסר או סומן כמאושר.",
  },
  {
    id: "F-1039", ruleId: "S2", ruleName: "גישה של עובדים שעזבו", category: "security", severity: "high",
    title: `${new Set(offboardedWithAccess.map((l) => l.personId)).size} עובדים שעזבו עדיין מחזיקים ${offboardedWithAccess.length} רישיונות AI`,
    summary: "המשתמשים הושבתו ב-Entra ID, אבל החשבונות בכלי ה-AI נשארו פעילים. שלושה מהם אף הראו פעילות אחרי תאריך העזיבה.",
    productIds: [...new Set(offboardedWithAccess.map((l) => l.productId))], deptIds: [...new Set(offboardedWithAccess.map((l) => personById[l.personId].deptId))], personIds: [...new Set(offboardedWithAccess.map((l) => l.personId))],
    detectedAt: isoAt(0, 6, 0), status: "in_progress", owner: { name: "IT Helpdesk", role: "IT" },
    impact: { risk: "גישה לשיחות ולקבצים של הארגון אחרי סיום העסקה", usdMonthly: offboardedWithAccess.reduce((s, l) => s + (productById[l.productId].seatPrice ?? 0), 0), users: new Set(offboardedWithAccess.map((l) => l.personId)).size },
    confidence: 0.99, coverageNote: "הצלבה בין סטטוס המשתמש ב-Entra ID לבין רשימות המשתמשים של כל כלי.",
    evidence: { columns: ["משתמש", "תאריך עזיבה", "כלי", "פעילות אחרונה"], rows: offboardedWithAccess.map((l) => [personById[l.personId].name, personById[l.personId].offboardedAt!, productById[l.productId].name, days(l.lastActiveDaysAgo)]) },
    remediation: { steps: ["להסיר את המשתמשים מכל כלי שמופיע בטבלה (קישורים לקונסולות בכרטיסי הכלים).", "לבדוק ביומני ה-audit פעילות שהתרחשה אחרי תאריך העזיבה.", "להגדיר deprovisioning אוטומטי דרך SCIM בכלים שתומכים בכך (ChatGPT, Claude, GitHub)."], consoleUrl: "https://admin.microsoft.com", consoleLabel: "Microsoft 365 Admin · Users" },
    message: "לצוות Helpdesk: מצורפת רשימת עובדים שעזבו ועדיין מחזיקים גישה לכלי AI. נא להסיר את הגישות ולעדכן בכרטיס.",
    verification: "הממצא ייסגר כשכל המשתמשים ברשימה לא יופיעו עוד כפעילים באף כלי.",
  },
  {
    id: "F-1038", ruleId: "C5", ruleName: "קפיצת עלות", category: "cost", severity: "high",
    title: `קפיצה של פי 3 בעלות OpenAI API בין ${isoDay(16).slice(5)} ל-${isoDay(12).slice(5)}`,
    summary: `עלות עודפת של ${usd(spikeExtra)} ב-5 ימים לעומת הממוצע של 4 השבועות הקודמים. 86% מהעודף מגיע מהמפתח proj-marketing-gen (שיווק), רובו במודל היקר ביותר.`,
    productIds: ["openai-api"], deptIds: ["marketing"], personIds: [R.mktOwner], detectedAt: isoAt(15, 7, 0), status: "open",
    owner: { name: who(R.mktOwner), role: "בעלים של המפתח proj-marketing-gen" }, impact: { usdMonthly: Math.round(spikeExtra * 1.2) },
    confidence: 0.88, coverageNote: "מבוסס על Usage ו-Costs API של OpenAI, בפירוק לפי project, API key ומודל.",
    evidence: { columns: ["יום", "עלות בפועל", "ממוצע בסיס", "סטייה", "מפתח עיקרי"], rows: spikeDays.map((d) => [d.date, usd(d.cost), usd(baseAvg), `+${Math.round((d.cost / baseAvg - 1) * 100)}%`, "proj-marketing-gen"]) },
    remediation: { steps: ["לברר עם בעלי המפתח אם מדובר בקמפיין מתוכנן או בלולאה או בשימוש לא צפוי.", "אם השימוש נמשך: להגדיר project budget ו-alert בקונסולת OpenAI.", "לבחון מעבר למודל זול יותר למשימות יצירת תוכן בנפח גבוה (ראו ממצא F-1033)."], consoleUrl: "https://platform.openai.com/settings/organization/general", consoleLabel: "OpenAI · Projects · Limits" },
    message: `שלום,\nבין ${isoDay(16)} ל-${isoDay(12)} העלות של proj-marketing-gen עלתה פי 3 (כ-${usd(spikeExtra)} מעבר לרגיל).\nנשמח להבין אם זה צפוי ואם השימוש ימשיך, כדי לעדכן את התקציב או להגדיר מגבלה.`,
    verification: "המערכת תעקוב אחרי העלות היומית ותסגור את הממצא אחרי 7 ימים רצופים בטווח הרגיל.",
  },
  inactiveLicenseFinding("m365", "F-1037", "high"),
  inactiveLicenseFinding("chatgpt", "F-1036", "medium"),
  {
    id: "F-1035", ruleId: "C3", ruleName: "מנויים חופפים", category: "cost", severity: "medium",
    title: `${overlap.length} עובדים מחזיקים גם ChatGPT Enterprise וגם Claude Enterprise`,
    summary: `${overlapLowUse.length} מהם כמעט לא משתמשים באחד משני הכלים (פחות מ-8 sessions בחודש). הורדת הרישיון המיותר חוסכת כ-${usd(overlapLowUse.length * 60)} בחודש.`,
    productIds: ["chatgpt", "claude"], deptIds: [...new Set(overlap.map((p) => p.deptId))], personIds: overlapLowUse.map((p) => p.id), detectedAt: isoAt(1, 6, 0), status: "open",
    owner: { name: "מנהל/ת רישוי SaaS", role: "IT" }, impact: { usdMonthly: overlapLowUse.length * 60, users: overlapLowUse.length },
    confidence: 0.84, coverageNote: "הצלבה של נתוני usage למשתמש משני הספקים. זהות מאוחדת לפי כתובת מייל.",
    evidence: {
      columns: ["משתמש", "מחלקה", "ChatGPT sessions", "Claude sessions", "המלצה"],
      rows: overlapLowUse.map((p) => {
        const cg = personUsage.find((u) => u.personId === p.id && u.productId === "chatgpt")?.sessions30 ?? 0;
        const cl = personUsage.find((u) => u.personId === p.id && u.productId === "claude")?.sessions30 ?? 0;
        return [p.name, deptById[p.deptId].name, cg, cl, cg < cl ? "להסיר ChatGPT" : "להסיר Claude"];
      }),
    },
    remediation: { steps: ["לאשר את הרשימה מול מנהלי המחלקות.", "להסיר בכל שורה את הרישיון שבשימוש נמוך, לפי עמודת ההמלצה.", "לקבוע מדיניות: כלי צ'אט ארגוני אחד כברירת מחדל, וכלי שני לפי צורך מוצדק."], consoleUrl: "https://chatgpt.com/admin", consoleLabel: "ChatGPT Admin · Members" },
    message: "שלום,\nיש לך גישה גם ל-ChatGPT Enterprise וגם ל-Claude Enterprise, אבל באחד מהם כמעט אין שימוש. נשמח לדעת באיזה כלי את/ה עובד/ת בפועל, כדי לפנות את הרישיון השני.",
    verification: "המערכת תבדוק בסנכרון הבא שמספר המשתמשים עם שני הרישיונות ירד.",
  },
  {
    id: "F-1034", ruleId: "S8", ruleName: "כלי שלא אושר", category: "security", severity: "medium",
    title: `Cursor Business בשימוש של ${licenses.filter((l) => l.productId === "cursor").length} מפתחים, והכלי עדיין בסטטוס "בבחינה"`,
    summary: `הכלי לא עבר אישור אבטחה, ובדיקות posture נכשלות: SSO לא נאכף, ומצב privacy (מניעת אימון על קוד) לא מופעל לכל המשתמשים. ${codeOverlap.length} מהמשתמשים מחזיקים גם GitHub Copilot.`,
    productIds: ["cursor"], deptIds: ["rnd", "data"], personIds: licenses.filter((l) => l.productId === "cursor").map((l) => l.personId), detectedAt: isoAt(3, 6, 0), status: "open",
    owner: { name: "ראש צוות אבטחת אפליקציות", role: "AppSec" }, impact: { risk: "קוד מקור נשלח לכלי בלי הסכם עיבוד נתונים ובלי privacy mode נאכף", usdMonthly: codeOverlap.length * 19, users: licenses.filter((l) => l.productId === "cursor").length },
    confidence: 0.8, coverageNote: "כיסוי חלקי: ל-Cursor אין יומן audit זמין, וה-posture מבוסס על Admin API.",
    evidence: { columns: ["בדיקה", "תוצאה"], rows: postureChecks.filter((c) => c.results.cursor !== "na").map((c) => [c.name, ({ pass: "עובר", fail: "נכשל", unknown: "לא ידוע", na: "—" } as const)[c.results.cursor]]) },
    remediation: { steps: ["להשלים סקירת אבטחה ורכש, או להחליט להפסיק את השימוש.", "אם מאשרים: לאכוף SSO ו-Privacy Mode ברמת הארגון בהגדרות Cursor.", `להחליט על כלי קוד אחד: ${codeOverlap.length} משתמשים משלמים גם על GitHub Copilot.`], consoleUrl: "https://cursor.com/dashboard", consoleLabel: "Cursor · Team settings" },
    message: "לראשי צוותי הפיתוח: Cursor נמצא בשימוש רחב לפני שהסתיימה סקירת האבטחה. נבקש להגדיר עד סוף השבוע Privacy Mode לכל המשתמשים, ולתאם עם AppSec את השלמת הסקירה.",
    verification: "הממצא ייסגר כשהכלי יסומן 'מאושר' בקטלוג וכשבדיקות ה-posture יעברו.",
  },
  {
    id: "F-1033", ruleId: "C6", ruleName: "תמהיל מודלים", category: "cost", severity: "medium",
    title: "support-classifier משתמש במודל Opus למשימת סיווג קצרה",
    summary: "94% מהקריאות הן סיווג של פניות (תשובה קצרה מ-40 tokens). מעבר ל-Haiku יחסוך כ-85% מעלות המפתח, בלי שינוי צפוי באיכות למשימה כזו.",
    productIds: ["anthropic-api"], deptIds: ["support"], personIds: [R.supportOwner], detectedAt: isoAt(4, 6, 0), status: "open",
    owner: { name: who(R.supportOwner), role: "בעלים של המפתח support-classifier" }, impact: { usdMonthly: Math.round(2210 * 0.85) },
    confidence: 0.72, coverageNote: "מבוסס על usage report לפי מודל ומפתח. תוכן הקריאות לא זמין, ולכן סוג המשימה מוסק מיחס ה-input/output.",
    evidence: { columns: ["מודל", "קריאות (30 יום)", "input ממוצע", "output ממוצע", "עלות"], rows: [["claude-opus", "182,400", "1,150", "38", "$2,080"], ["claude-sonnet", "9,100", "2,300", "410", "$130"]] },
    remediation: { steps: ["להריץ השוואת איכות על 200 פניות עם Haiku מול Opus.", "אם האיכות דומה: להחליף את שם המודל בקוד השירות.", "לעקוב בדשבורד אחרי העלות והדיוק במשך שבועיים."], consoleUrl: "https://console.anthropic.com/settings/keys", consoleLabel: "Claude Console · Usage" },
    message: "שלום,\nהשירות support-classifier עולה כ-$2,200 בחודש ורץ על המודל היקר ביותר, למשימת סיווג קצרה. נשמח לבדוק איתך מעבר ל-Haiku, שיכול לחסוך כ-85%.",
    verification: "המערכת תזהה בסנכרון הבא את שינוי המודל ואת ירידת העלות.",
  },
  {
    id: "F-1032", ruleId: "C4", ruleName: "חריגה מתקציב", category: "cost", severity: overBudget.length ? "high" : "low",
    title: overBudget.length ? `מחלקת ${overBudget[0].d.name} צפויה לחרוג מתקציב ה-AI החודשי ב-${Math.round((overBudget[0].f / overBudget[0].d.monthlyBudget - 1) * 100)}%` : "כל המחלקות בתקציב",
    summary: `תחזית לסוף ספטמבר: ${usd(overBudget[0]?.f ?? 0)} מול תקציב של ${usd(overBudget[0]?.d.monthlyBudget ?? 0)}. ${overBudget.length} מחלקות צפויות לחרוג.`,
    productIds: [], deptIds: overBudget.map((x) => x.d.id), personIds: [], detectedAt: isoAt(0, 6, 0), status: "open",
    owner: { name: "FP&A", role: "כספים" }, impact: { usdMonthly: Math.round(overBudget.reduce((s, x) => s + x.f - x.d.monthlyBudget, 0)) },
    confidence: 0.81, coverageNote: "רישיונות נספרים לפי מחיר חוזה (license). עלות API מיוחסת לפי בעלי המפתחות. תחזית לינארית עם עונתיות שבועית.",
    evidence: { columns: ["מחלקה", "מרכז עלות", "תקציב", "תחזית", "חריגה"], rows: overBudget.map((x) => [x.d.name, x.d.costCenter, usd(x.d.monthlyBudget), usd(x.f), `+${Math.round((x.f / x.d.monthlyBudget - 1) * 100)}%`]) },
    remediation: { steps: ["לעבור עם מנהלי המחלקות על פירוט העלות במסך המחלקה.", "לטפל קודם בממצאי החיסכון הפתוחים של המחלקות האלה.", "לעדכן את התקציב אם הגידול מוצדק עסקית."], consoleUrl: "#/departments", consoleLabel: "מסך מחלקות ומרכזי עלות" },
    message: "למנהלי המחלקות: מצורפת תחזית עלות ה-AI לחודש הנוכחי מול התקציב, עם פירוט לפי כלי ולפי ממצאי חיסכון פתוחים.",
    verification: "הממצא מתעדכן בכל סנכרון ונסגר בסוף החודש.",
  },
  {
    id: "F-1031", ruleId: "S1", ruleName: "תצורת אבטחה", category: "security", severity: "high",
    title: "ChatGPT Enterprise: שמירת נתונים שונתה ל'ללא הגבלה', ושיתוף ציבורי של GPTs פתוח",
    summary: `3 בדיקות posture נכשלות ב-ChatGPT Enterprise. אחת מהן נגרמה משינוי שבוצע היום ב-09:03 על ידי ${who(R.itAdmin)}.`,
    productIds: ["chatgpt"], deptIds: ["it"], personIds: [R.itAdmin], detectedAt: isoAt(0, 9, 5), status: "open", realtime: true,
    owner: { name: "מנהל/ת ChatGPT Enterprise", role: "IT" }, impact: { risk: "שיחות נשמרות ללא הגבלת זמן, ו-GPTs פנימיים עלולים להיחשף מחוץ לארגון" },
    confidence: 0.95, coverageNote: "מבוסס על הגדרות ה-workspace ויומן ה-audit.",
    evidence: { columns: ["בדיקה", "מצב נוכחי", "מצב נדרש", "שינוי אחרון"], rows: [["מדיניות שמירת נתונים", "ללא הגבלה", "90 יום", `היום 09:03 · ${who(R.itAdmin)}`], ["שיתוף ציבורי של GPTs", "מותר", "כבוי", "לפני 41 ימים"], ["GPTs ו-connectors צד שלישי", "מותר לכולם", "באישור מנהל", `לפני יומיים · ${who(R.itAdmin)}`]] },
    remediation: { steps: ["להחזיר את Data retention ל-90 יום: Workspace settings → Data controls.", "לכבות את 'Allow public sharing of GPTs' ב-Workspace settings → GPTs.", "להגביל GPTs ו-connectors צד שלישי לרשימה מאושרת.", "לברר עם מבצע השינוי את הסיבה ולתעד אותה."], consoleUrl: "https://chatgpt.com/admin", consoleLabel: "ChatGPT Admin · Workspace settings" },
    message: `שלום,\nהיום בשעה 09:03 שונתה מדיניות שמירת הנתונים ב-ChatGPT Enterprise ל'ללא הגבלה'. השינוי סותר את מדיניות הארגון (90 יום). נבקש להחזיר את ההגדרה, או לפתוח בקשת שינוי מסודרת.`,
    verification: "המערכת בודקת את ההגדרות בכל סנכרון, והבדיקה תעבור אוטומטית כשההגדרה תתוקן.",
  },
  {
    id: "F-1030", ruleId: "S3", ruleName: "מפתחות API בסיכון", category: "security", severity: "high",
    title: "2 מפתחות API פעילים בלי בעלים פעיל, ואחד מהם עם הרשאה מלאה",
    summary: `המפתח legacy-search שייך ל-${who(R.leaver)}, שעזב/ה את הארגון, ועדיין צורך ${usd(640)} בחודש. למפתח hackathon-2025 אין בעלים בכלל.`,
    productIds: ["openai-api", "anthropic-api"], deptIds: [personById[R.leaver].deptId], personIds: [R.leaver], detectedAt: isoAt(2, 6, 0), status: "open",
    owner: { name: "Platform Engineering", role: "R&D" }, impact: { risk: "מפתח עם הרשאה מלאה בידי מי שכבר לא עובד בארגון", usdMonthly: 930 },
    confidence: 0.96, coverageNote: "רשימת המפתחות מה-Admin API של הספקים, מוצלבת עם Entra ID.",
    evidence: { columns: ["מפתח", "כלי", "בעלים", "נוצר", "שימוש אחרון", "הרשאה", "עלות 30 יום"], rows: apiKeys.filter((k) => !k.ownerId || personById[k.ownerId].status === "offboarded").map((k) => [k.name, productById[k.productId].name, k.ownerId ? `${who(k.ownerId)} (עזב/ה)` : "—", `לפני ${k.createdDaysAgo} ימים`, days(k.lastUsedDaysAgo), k.scope, usd(k.cost30)]) },
    remediation: { steps: ["לזהות את השירות שמשתמש במפתח (שם ה-project ויומני השירות).", "להנפיק מפתח חדש עם הרשאות מינימליות לבעלים פעיל, ולהחליף אותו בשירות.", "לבטל את המפתח הישן בקונסולה."], consoleUrl: "https://platform.openai.com/settings/organization/api-keys", consoleLabel: "OpenAI · API keys" },
    message: "ל-Platform Engineering: שני מפתחות API פעילים נמצאו ללא בעלים פעיל (פירוט בטבלה). נא להעביר בעלות ולהחליף את המפתחות.",
    verification: "הממצא ייסגר כשהמפתחות יבוטלו או כשיוגדר להם בעלים פעיל.",
  },
  {
    id: "F-1029", ruleId: "U2", ruleName: "מוצר בניצול נמוך", category: "usage", severity: "medium",
    title: "אימוץ נמוך של Microsoft 365 Copilot: 42% פעילים שבועית מתוך בעלי הרישיון",
    summary: "במחלקות מכירות ותמיכה האימוץ מתחת ל-30%. בפיתוח ובמוצר הוא מעל 60%. העלות לכל משתמש פעיל היא כ-$71, מול מחיר רשמי של $30.",
    productIds: ["m365"], deptIds: ["sales", "support"], personIds: [], detectedAt: isoAt(2, 6, 0), status: "open",
    owner: { name: "Digital Workplace", role: "IT" }, impact: { usdMonthly: 3400, users: 232 },
    confidence: 0.78, coverageNote: "דוחות Copilot usage של Microsoft Graph מגיעים באיחור של כ-48 שעות.",
    evidence: { columns: ["מחלקה", "רישיונות", "פעילים שבועית", "אימוץ"], rows: [["מכירות", 70, 19, "27%"], ["תמיכה ושירות", 58, 16, "28%"], ["כספים", 22, 9, "41%"], ["פיתוח", 128, 81, "63%"], ["מוצר", 27, 18, "67%"]] },
    remediation: { steps: ["לקיים סדנת שימוש ממוקדת למכירות ולתמיכה (תרחישים: סיכום פגישות, מענה למיילים).", "לסמן לאלופי Copilot במחלקות המובילות לשמש מנטורים.", "אחרי 30 יום: להעביר רישיונות לא פעילים למחלקות עם ביקוש (ראו F-1037)."], consoleUrl: "https://admin.microsoft.com", consoleLabel: "M365 Admin · Reports · Copilot" },
    message: "למנהלי מכירות ותמיכה: אימוץ Copilot במחלקות שלכם נמוך מ-30%. נשמח לתאם סדנה של 45 דקות עם תרחישי שימוש מותאמים.",
    verification: "המערכת תעקוב אחרי אחוז האימוץ השבועי למחלקה.",
  },
  {
    id: "F-1028", ruleId: "U1", ruleName: "משתמשים כבדים", category: "usage", severity: "low",
    title: `${who(heavy[0].personId)} צרך/ה פי 6 יותר tokens מהחציון של עמיתיו/ה`,
    summary: "5 משתמשים אחראים ל-22% מצריכת ה-tokens בכלי הצ'אט וה-API. זה לא בהכרח שלילי: חלקם אוטומציות לגיטימיות, וחלקם מועמדים להדרכה על שימוש יעיל.",
    productIds: ["anthropic-api", "chatgpt"], deptIds: [...new Set(heavy.map((h) => personById[h.personId].deptId))], personIds: heavy.map((h) => h.personId), detectedAt: isoAt(1, 6, 0), status: "open",
    owner: { name: "AI Enablement", role: "CoE" }, impact: { users: 5 },
    confidence: 0.7, coverageNote: "ספירת tokens לפי משתמש זמינה רק בחלק מהכלים. ב-Microsoft 365 Copilot אין נתוני tokens.",
    evidence: { columns: ["משתמש", "מחלקה", "כלי", "tokens (30 יום)", "sessions"], rows: heavy.map((h) => [who(h.personId), deptName(h.personId), productById[h.productId].name, `${(h.tokens30 / 1e6).toFixed(1)}M`, h.sessions30]) },
    remediation: { steps: ["לבדוק אם מדובר באוטומציה. אם כן, להעביר אותה למפתח API ייעודי עם בעלות ותקציב.", "לשתף את המשתמשים בטיפים לשימוש יעיל (context קצר, מודל מתאים)."], consoleUrl: "#/users", consoleLabel: "מסך משתמשים" },
    message: "שלום,\nהשימוש שלך בכלי ה-AI גבוה משמעותית מהממוצע, וזה מצוין. נשמח להבין את תרחישי השימוש שלך כדי לשתף אותם בארגון, ולוודא שהכלים מתאימים לך.",
    verification: "ממצא מידע. הוא נסגר ידנית.",
  },
  {
    id: "F-1027", ruleId: "D1", ruleName: "סנכרון נכשל", category: "data", severity: "medium", realtime: true,
    title: "החיבור ל-Cursor נכשל ב-31 השעות האחרונות (HTTP 401)",
    summary: "מפתח ה-Admin בוטל או שפג תוקפו. עד לתיקון, נתוני השימוש והעלות של Cursor לא מתעדכנים, והממצאים על הכלי מבוססים על נתונים ישנים.",
    productIds: ["cursor"], deptIds: [], personIds: [], detectedAt: isoAt(1, 7, 10), status: "open",
    owner: { name: "מנהל/ת המערכת", role: "Admin" }, impact: { risk: "תמונת מצב חלקית על כלי שנמצא בבחינה" },
    confidence: 1, coverageNote: "סטטוס הסנכרון נקבע על ידי המערכת עצמה.",
    evidence: { columns: ["ניסיון", "זמן", "תוצאה"], rows: [["#412", "27/09 07:10", "401 Unauthorized"], ["#413", "27/09 13:10", "401 Unauthorized"], ["#414", "28/09 07:10", "401 Unauthorized"]] },
    remediation: { steps: ["להנפיק Admin API key חדש ב-Cursor dashboard.", "לעדכן אותו במסך חיבורים → Cursor → עדכון פרטי התחברות.", "ללחוץ על 'סנכרן עכשיו' ולוודא שהסטטוס חזר לתקין."], consoleUrl: "#/connections", consoleLabel: "מסך חיבורים" },
    message: "—",
    verification: "הממצא ייסגר אוטומטית בסנכרון המוצלח הבא.",
  },
];

export const liveEvents: LiveEvent[] = [
  { id: "e1", minutesAgo: 3, productId: "chatgpt", severity: "critical", text: "38 מספרי ת\"ז זוהו בשיחה חדשה", findingId: "F-1041" },
  { id: "e2", minutesAgo: 9, productId: "claude", severity: "medium", text: "3 משתמשים חדשים נוספו ל-workspace משפטי" },
  { id: "e3", minutesAgo: 17, productId: "anthropic-api", severity: "low", text: "claude-code-rnd עבר 80% ממגבלת ההוצאה החודשית" },
  { id: "e4", minutesAgo: 41, productId: "chatgpt", severity: "high", text: "מדיניות שמירת נתונים שונתה ל'ללא הגבלה'", findingId: "F-1031" },
  { id: "e5", minutesAgo: 58, productId: "claude", severity: "high", text: "מפתח AWS זוהה בשיחה (הושחר)" },
  { id: "e6", minutesAgo: 95, productId: "m365", severity: "low", text: "דוח Copilot usage עודכן (נתונים עד 26/09)" },
  { id: "e7", minutesAgo: 431, productId: "claude", severity: "critical", text: "מנהל ארגון חיצוני נוסף בשעה 02:14", findingId: "F-1040" },
];
