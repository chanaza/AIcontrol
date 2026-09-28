import { useState } from "react";
import { BarList, BudgetBar, Donut, Legend, TimeChart } from "../components/charts";
import { FindingRow } from "../components/FindingRow";
import { CostTypeTag, DataTable, Kpi, PageHead, Panel, ProductDot, Seg } from "../components/ui";
import { departments, isoDay, products } from "../data/mock";
import { pct, usd, usdK } from "../lib/format";
import { go } from "../lib/router";
import { deptSummary, findingStats, isOpen, orgTotals, productSummary, seriesByProduct } from "../lib/selectors";
import { useStore } from "../lib/store";

const MODEL_MIX = [
  { model: "gpt-4.1", vendor: "OpenAI", share: 0.46, cost: 5230, note: "63% ממנו ב-proj-marketing-gen" },
  { model: "gpt-4.1-mini", vendor: "OpenAI", share: 0.21, cost: 980, note: "" },
  { model: "claude-opus", vendor: "Anthropic", share: 0.2, cost: 3120, note: "support-classifier: משימת סיווג קצרה" },
  { model: "claude-sonnet", vendor: "Anthropic", share: 0.09, cost: 4410, note: "רובו Claude Code" },
  { model: "claude-haiku", vendor: "Anthropic", share: 0.04, cost: 160, note: "" },
];

export function Costs() {
  const { findings } = useStore();
  const [range, setRange] = useState<"30" | "90">("90");
  const t = orgTotals();
  const fs = findingStats(findings);
  const s = seriesByProduct("cost", Number(range));
  const spike = s.dates.indexOf(isoDay(14));
  const rows = products.map((p) => productSummary(p.id));
  const depts = departments.map((d) => ({ d, ...deptSummary(d.id) }));
  const savings = findings.filter((f) => isOpen(f) && f.impact.usdMonthly && (f.category === "cost" || f.category === "usage")).sort((a, b) => (b.impact.usdMonthly ?? 0) - (a.impact.usdMonthly ?? 0));

  return (
    <div className="page">
      <PageHead title="עלויות ואופטימיזציה" sub="עלות בפועל, עלות רישיונות לפי חוזה והערכות מופרדות תמיד. הערכה לעולם לא מוצגת כנתון רשמי." action={<Seg label="טווח" value={range} onChange={setRange} options={[{ value: "30", label: "30 יום" }, { value: "90", label: "90 יום" }]} />} />
      <div className="kpis">
        <Kpi label="תחזית לספטמבר" value={usdK(t.forecast)} delta={t.forecast / t.prev - 1} sub="מול אוגוסט" />
        <Kpi label="עד היום (28 ימים)" value={usdK(t.mtd)} sub="מצטבר החודש" />
        <Kpi label="רישיונות (חוזה)" value={usdK(t.licenseCost)} sub={`${pct(t.licenseCost / t.forecast)} מהעלות`} />
        <Kpi label="שימוש (API, בפועל)" value={usdK(t.usageCost)} sub={`${pct(t.usageCost / t.forecast)} מהעלות`} />
        <Kpi label="עלות לעובד פעיל" value={usd(t.forecast / t.activeUsers)} sub={`${t.activeUsers} פעילים`} />
        <Kpi label="חיסכון זמין" value={usdK(fs.savings)} sub={`${usdK(fs.savings * 12)} בשנה`} />
      </div>
      <div className="grid g-main">
        <Panel title="עלות יומית לפי כלי" sub="הקו האדום מסמן חריגה שזוהתה (F-1038)">
          <TimeChart dates={s.dates} series={s.series} format={usdK} markers={spike > 0 ? [{ index: spike, label: "F-1038" }] : []} />
          <Legend items={s.series.map((x) => ({ label: x.label, color: x.color }))} />
        </Panel>
        <Panel title="הזדמנויות חיסכון" sub="ממצאים פתוחים, ממוינים לפי חיסכון חודשי">
          {savings.map((f) => <FindingRow key={f.id} f={f} compact />)}
        </Panel>
      </div>
      <Panel title="עלות וניצול לפי כלי" sub="לחצו על שורה לפירוט הכלי">
        <DataTable rows={rows} onRow={(r) => go("products", r.p.id)} initialSort={{ key: "cost", dir: -1 }} columns={[
          { key: "p", label: "כלי", render: (r) => <ProductDot id={r.p.id} />, sort: (r) => r.p.name },
          { key: "bill", label: "חיוב", render: (r) => <CostTypeTag t={r.costType} /> },
          { key: "seats", label: "מושבים", num: true, render: (r) => r.seats || "—", sort: (r) => r.seats },
          { key: "active", label: "פעילים (30 יום)", num: true, render: (r) => r.users30, sort: (r) => r.users30 },
          { key: "util", label: "ניצול", num: true, render: (r) => r.utilization === null ? "—" : <span style={{ color: r.utilization < 0.7 ? "var(--crit)" : undefined }}>{pct(r.utilization)}</span>, sort: (r) => r.utilization ?? 2 },
          { key: "cost", label: "תחזית חודשית", num: true, render: (r) => usd(r.forecast), sort: (r) => r.forecast },
          { key: "cpu", label: "לעובד פעיל", num: true, render: (r) => usd(r.forecast / Math.max(1, r.users30)), sort: (r) => r.forecast / Math.max(1, r.users30) },
          { key: "trend", label: "מול חודש קודם", num: true, render: (r) => <span className={`delta ${r.forecast > r.prev * 1.02 ? "up-bad" : "flat"}`}>{r.forecast >= r.prev ? "+" : ""}{pct(r.forecast / r.prev - 1)}</span>, sort: (r) => r.forecast / r.prev },
          { key: "idle", label: "מושבים לא פעילים", num: true, render: (r) => r.seats ? r.assigned - r.active : "—", sort: (r) => r.assigned - r.active },
        ]} />
      </Panel>
      <div className="grid g2">
        <Panel title="Chargeback לפי מרכז עלות" sub="רישיונות לפי מחיר חוזה ועלות API מיוחסת לבעלי המפתחות">
          <DataTable rows={depts} onRow={(r) => go("departments", r.d.id)} initialSort={{ key: "f", dir: -1 }} columns={[
            { key: "d", label: "מחלקה", render: (r) => r.d.name, sort: (r) => r.d.name },
            { key: "cc", label: "מרכז עלות", render: (r) => <span className="mono">{r.d.costCenter}</span> },
            { key: "f", label: "תחזית", num: true, render: (r) => usd(r.forecast), sort: (r) => r.forecast },
            { key: "b", label: "תקציב", num: true, render: (r) => usd(r.d.monthlyBudget), sort: (r) => r.d.monthlyBudget },
            { key: "bar", label: "", render: (r) => <div style={{ minWidth: 90 }}><BudgetBar value={r.forecast} budget={r.d.monthlyBudget} /></div> },
            { key: "idle", label: "בזבוז (מושבים לא פעילים)", num: true, render: (r) => usd(r.idleCost), sort: (r) => r.idleCost },
          ]} />
        </Panel>
        <Panel title="תמהיל מודלים ב-API" sub="30 יום · מקור: usage report לפי מודל">
          <div className="row" style={{ alignItems: "center", gap: 20, marginBottom: 12 }}>
            <Donut parts={MODEL_MIX.map((m, i) => ({ value: m.cost, color: `var(--p${[6, 1, 2, 7, 4][i]})`, label: m.model }))} center={<span className="small"><b className="num" style={{ fontSize: 16 }}>{usdK(MODEL_MIX.reduce((a, m) => a + m.cost, 0))}</b><br /><span className="muted">30 יום</span></span>} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <BarList items={MODEL_MIX.map((m, i) => ({ label: <span className="mono">{m.model}</span>, value: m.cost, color: `var(--p${[6, 1, 2, 7, 4][i]})` }))} format={usd} />
            </div>
          </div>
          <div className="stack small">
            {MODEL_MIX.filter((m) => m.note).map((m) => <div key={m.model}><span className="mono">{m.model}</span> <span className="muted">· {m.note}</span></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}
