import { useEffect, useState } from "react";
import { PageHead, Panel, ProductDot, Seg, SevPill, Toggle } from "../components/ui";
import { connections, liveEvents, productById } from "../data/mock";
import type { LiveEvent, Severity } from "../data/types";
import { minutesAgo } from "../lib/format";
import { href } from "../lib/router";

// Simulated arrivals so the stream behaves like the real one; the real feed is pushed from the ingestion workers.
const INCOMING: Omit<LiveEvent, "id" | "minutesAgo">[] = [
  { productId: "openai-api", severity: "medium", text: "proj-marketing-gen: צריכה שעתית פי 2.4 מהרגיל" },
  { productId: "chatgpt", severity: "low", text: "12 משתמשים חדשים הצטרפו דרך SSO" },
  { productId: "claude", severity: "high", text: "קובץ עם 214 כתובות מייל של לקוחות הועלה לפרויקט" },
  { productId: "ghcopilot", severity: "low", text: "דוח metrics יומי התקבל" },
  { productId: "m365", severity: "medium", text: "Copilot ניגש לתיקיית SharePoint עם תווית \"סודי\"" },
  { productId: "anthropic-api", severity: "low", text: "Claude Code: 38 מפתחים פעילים בשעה האחרונה" },
];

interface Rule { id: string; name: string; min: Severity; channel: string; on: boolean }

export function Live() {
  const [events, setEvents] = useState<(LiveEvent & { fresh?: boolean })[]>(liveEvents);
  const [filter, setFilter] = useState<"all" | "high">("all");
  const [rules, setRules] = useState<Rule[]>([
    { id: "r1", name: "מידע רגיש בתוכן (S6)", min: "high", channel: "Slack #sec-alerts + מייל ל-CISO", on: true },
    { id: "r2", name: "פעולת מנהל חריגה (S4)", min: "high", channel: "Slack #sec-alerts", on: true },
    { id: "r3", name: "קפיצת עלות (C5)", min: "medium", channel: "Teams · FinOps", on: true },
    { id: "r4", name: "חריגה מתקציב (C4)", min: "medium", channel: "מייל למנהל/ת המחלקה", on: true },
    { id: "r5", name: "סנכרון נכשל (D1)", min: "medium", channel: "מייל למנהל/ת המערכת", on: true },
    { id: "r6", name: "רישיונות לא פעילים (C1)", min: "low", channel: "סיכום שבועי", on: false },
  ]);

  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      const next = INCOMING[i++ % INCOMING.length];
      setEvents((es) => [{ ...next, id: `n${Date.now()}`, minutesAgo: 0, fresh: true }, ...es.map((e) => ({ ...e, fresh: false }))].slice(0, 40));
    }, 9000);
    return () => window.clearInterval(t);
  }, []);

  const shown = events.filter((e) => filter === "all" || e.severity === "critical" || e.severity === "high");

  return (
    <div className="page">
      <PageHead title="זרם בזמן אמת" sub="אירועים וממצאים מכל החיבורים, מיד כשהם נקלטים. השיהוי תלוי בספק: audit ותוכן לרוב תוך דקות, דוחות usage לעיתים יומיים." />
      <div className="grid g-main">
        <Panel title="אירועים" sub="מתעדכן אוטומטית" action={<Seg label="סינון" value={filter} onChange={setFilter} options={[{ value: "all", label: "הכול" }, { value: "high", label: "גבוה וקריטי" }]} />}>
          <div className="feed" aria-live="polite">
            {shown.map((e) => (
              <div key={e.id} className={`feed-item ${e.fresh ? "fresh" : ""}`}>
                <span className="t">{minutesAgo(e.minutesAgo)}</span>
                <span className={`stripe ${e.severity}`} />
                <span className="spread" style={{ alignItems: "flex-start" }}>
                  <span>{e.findingId ? <a href={href("findings", e.findingId)}>{e.text}</a> : e.text}<br /><span className="muted small">{productById[e.productId].name}</span></span>
                  <SevPill s={e.severity} />
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid">
          <Panel title="כללי התראה" sub="לאן נשלחת התראה כשממצא נפתח">
            {rules.map((r) => (
              <div key={r.id} className="setting">
                <div><b style={{ fontWeight: 500 }}>{r.name}</b><div className="small muted">{r.channel} · מחומרה {({ critical: "קריטית", high: "גבוהה", medium: "בינונית", low: "נמוכה" } as const)[r.min]}</div></div>
                <Toggle on={r.on} label={r.name} onChange={(v) => setRules(rules.map((x) => (x.id === r.id ? { ...x, on: v } : x)))} />
              </div>
            ))}
          </Panel>
          <Panel title="שיהוי לפי חיבור">
            <div className="stack">
              {connections.map((c) => <div key={c.productId} className="stack" style={{ gap: 2 }}><div className="spread"><ProductDot id={c.productId} /><span className={`pill ${c.status === "healthy" ? "ok" : "bad"}`}>{c.freshness}</span></div><span className="small muted">{c.vendorLatency}</span></div>)}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
