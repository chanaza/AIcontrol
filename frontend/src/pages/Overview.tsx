import { useState } from "react";
import { BarList, BudgetBar, Legend, TimeChart } from "../components/charts";
import { FindingRow } from "../components/FindingRow";
import { Kpi, PageHead, Panel, ProductDot, Seg } from "../components/ui";
import { connections, departments, isoDay, liveEvents, productById, products } from "../data/mock";
import { compact, minutesAgo, pct, usdK } from "../lib/format";
import { href } from "../lib/router";
import { deptSummary, findingStats, isOpen, orgTotals, postureScore, productSummary, seriesByProduct } from "../lib/selectors";
import { useStore } from "../lib/store";
import type { FindingCategory } from "../data/types";

type Persona = "all" | "finance" | "security" | "it";
const PERSONA_CATS: Record<Persona, FindingCategory[]> = { all: ["cost", "security", "usage", "data"], finance: ["cost", "usage"], security: ["security"], it: ["data", "security", "usage", "cost"] };
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export function Overview() {
  const { findings } = useStore();
  const [persona, setPersona] = useState<Persona>("all");
  const t = orgTotals();
  const fs = findingStats(findings);
  const posture = postureScore();
  const cost = seriesByProduct("cost", 90);
  const spikeIndex = cost.dates.indexOf(isoDay(14));
  const attention = findings.filter((f) => isOpen(f) && PERSONA_CATS[persona].includes(f.category))
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || (b.impact.usdMonthly ?? 0) - (a.impact.usdMonthly ?? 0)).slice(0, 6);
  const summaries = products.map((p) => productSummary(p.id)).sort((a, b) => b.forecast - a.forecast);
  const depts = departments.map((d) => ({ d, s: deptSummary(d.id) })).sort((a, b) => b.s.forecast / b.d.monthlyBudget - a.s.forecast / a.d.monthlyBudget);
  const secOpen = findings.filter((f) => isOpen(f) && f.category === "security").length;

  const kpis = {
    cost: <Kpi key="cost" label="עלות צפויה לספטמבר" value={usdK(t.forecast)} delta={t.forecast / t.prev - 1} sub="מול אוגוסט" />,
    savings: <Kpi key="savings" label="חיסכון זמין" value={usdK(fs.savings)} sub="לחודש, מממצאים פתוחים" />,
    budget: <Kpi key="budget" label="תחזית מול תקציב" value={pct(t.forecast / t.budget)} sub={`תקציב ${usdK(t.budget)}`} />,
    findings: <Kpi key="findings" label="ממצאים פתוחים" value={fs.open} sub={`${fs.bySev.critical} קריטיים · ${fs.bySev.high} גבוהים`} />,
    security: <Kpi key="security" label="ממצאי אבטחה פתוחים" value={secOpen} sub={`${fs.bySev.critical} קריטיים`} />,
    posture: <Kpi key="posture" label="ציון תצורת אבטחה" value={pct(posture.score)} sub={`${posture.fail} בדיקות נכשלות`} />,
    users: <Kpi key="users" label="משתמשים פעילים" value={t.activeUsers} sub={`מתוך ${t.licensedPeople} בעלי רישיון`} />,
    sessions: <Kpi key="sessions" label="Sessions ב-30 יום" value={compact(t.sessions30)} delta={t.sessions30 / t.sessionsPrev - 1} goodWhen="none" sub="מול 30 הימים הקודמים" />,
    tokens: <Kpi key="tokens" label="Tokens ב-30 יום" value={compact(t.tokens30)} delta={t.tokens30 / t.tokensPrev - 1} goodWhen="none" sub="בכלים שמדווחים tokens" />,
    conns: <Kpi key="conns" label="חיבורים תקינים" value={`${connections.filter((c) => c.status === "healthy").length}/${connections.length}`} sub="1 חיבור נכשל" />,
  };
  const order: Record<Persona, (keyof typeof kpis)[]> = {
    all: ["cost", "savings", "findings", "users", "posture", "sessions"],
    finance: ["cost", "savings", "budget", "users", "sessions", "tokens"],
    security: ["security", "posture", "findings", "users", "conns", "sessions"],
    it: ["conns", "users", "findings", "savings", "posture", "sessions"],
  };

  return (
    <div className="page">
      <PageHead title="סקירה" sub="תמונת מצב של כל כלי ה-AI בארגון · ספטמבר 2026 · עלויות, סיכונים ושימוש במקום אחד"
        action={<Seg label="תצוגה לפי תפקיד" value={persona} onChange={setPersona} options={[{ value: "all", label: "הכול" }, { value: "finance", label: "כספים" }, { value: "security", label: "אבטחה" }, { value: "it", label: "IT" }]} />} />
      <div className="kpis">{order[persona].map((k) => kpis[k])}</div>

      <div className="grid g-main">
        <Panel title="עלות יומית לפי כלי" sub="90 יום · רישיונות מחולקים ליום לפי מחיר חוזה · API לפי חיוב בפועל" action={<a href={href("costs")} className="small">לניתוח עלויות</a>}>
          <TimeChart dates={cost.dates} series={cost.series} format={usdK} markers={spikeIndex > 0 ? [{ index: spikeIndex, label: "F-1038" }] : []} />
          <Legend items={cost.series.map((s) => ({ label: s.label, color: s.color }))} />
        </Panel>
        <Panel title="דורש טיפול" sub="ממויין לפי חומרה ואחר כך השפעה כספית" action={<a href={href("findings")} className="small">כל הממצאים ({fs.open})</a>}>
          {attention.map((f) => <FindingRow key={f.id} f={f} compact />)}
        </Panel>
      </div>

      <div className="grid g3">
        <Panel title="עלות חודשית לפי כלי" sub="תחזית לסוף החודש">
          <BarList items={summaries.map((s) => ({ label: <ProductDot id={s.p.id} />, value: s.forecast, color: s.p.color }))} format={usdK} />
        </Panel>
        <Panel title="מה השתנה" sub="30 הימים האחרונים מול 30 הקודמים">
          <div className="stack">
            {summaries.filter((s) => Math.abs(s.sessionsTrend) > 0.03).sort((a, b) => Math.abs(b.sessionsTrend) - Math.abs(a.sessionsTrend)).slice(0, 5).map((s) => (
              <div key={s.p.id} className="spread"><ProductDot id={s.p.id} /><span className={`delta ${s.sessionsTrend > 0 ? "up-good" : "down-bad"}`}>{s.sessionsTrend > 0 ? "▲" : "▼"} {Math.abs(s.sessionsTrend * 100).toFixed(0)}% sessions</span></div>
            ))}
            <div className="divider" />
            <div className="spread"><span>עלות API (OpenAI ו-Anthropic)</span><span className="delta up-bad">▲ {pct(productSummary("openai-api").forecast / productSummary("openai-api").prev - 1)} / {pct(productSummary("anthropic-api").forecast / productSummary("anthropic-api").prev - 1)}</span></div>
            <div className="spread"><span>ניצול רישיונות M365 Copilot</span><span className="delta down-bad">{pct(productSummary("m365").utilization ?? 0)}</span></div>
          </div>
        </Panel>
        <Panel title="זרם בזמן אמת" sub="אירועים אחרונים מכל החיבורים" action={<a href={href("live")} className="small">לזרם המלא</a>}>
          <div className="feed">
            {liveEvents.slice(0, 5).map((e) => (
              <a key={e.id} className="feed-item" href={e.findingId ? href("findings", e.findingId) : href("live")} style={{ color: "var(--ink)" }}>
                <span className="t">{minutesAgo(e.minutesAgo)}</span>
                <span className={`stripe ${e.severity}`} />
                <span>{e.text}<br /><span className="muted small">{productById[e.productId].name}</span></span>
              </a>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid g2">
        <Panel title="מחלקות: תחזית מול תקציב" sub="הקו השחור הוא התקציב החודשי" action={<a href={href("departments")} className="small">לכל המחלקות</a>}>
          <div className="stack">
            {depts.slice(0, 6).map(({ d, s }) => (
              <a key={d.id} href={href("departments", d.id)} style={{ color: "var(--ink)", display: "grid", gridTemplateColumns: "minmax(80px,130px) minmax(0,1fr) 110px", gap: 10, alignItems: "center" }}>
                <span>{d.name}</span><BudgetBar value={s.forecast} budget={d.monthlyBudget} />
                <span className="num small" style={{ textAlign: "end", color: s.forecast > d.monthlyBudget ? "var(--crit)" : undefined }}>{pct(s.forecast / d.monthlyBudget)} מהתקציב</span>
              </a>
            ))}
          </div>
        </Panel>
        <Panel title="כיסוי נתונים לפי חיבור" sub="מה כל ספק באמת חושף. המערכת לא ממציאה נתונים שחסרים" action={<a href={href("connections")} className="small">לחיבורים</a>}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>כלי</th><th className="num">שימוש</th><th className="num">עלות</th><th className="num">Audit</th><th className="num">תוכן</th><th>עדכון</th></tr></thead>
              <tbody>
                {connections.map((c) => (
                  <tr key={c.productId}>
                    <td><ProductDot id={c.productId} /></td>
                    {(["usage", "cost", "audit", "content"] as const).map((k) => <td key={k} className="num" style={{ color: c.coverage[k] === 0 ? "var(--muted)" : undefined }}>{c.coverage[k] ? `${c.coverage[k]}%` : "—"}</td>)}
                    <td><span className={`pill ${c.status === "healthy" ? "ok" : "bad"}`} title={`עודכן לפני ${c.freshness}`}>{c.status === "healthy" ? "תקין" : "נכשל"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
