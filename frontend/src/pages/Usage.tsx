import { useState } from "react";
import { BarList, Legend, TimeChart } from "../components/charts";
import { DataTable, Kpi, PageHead, Panel, ProductDot, Seg } from "../components/ui";
import { departments, licenses, people, personById, personUsage, productById, products } from "../data/mock";
import { compact, num, pct } from "../lib/format";
import { go } from "../lib/router";
import { orgTotals, productSummary, seriesByProduct } from "../lib/selectors";

const SEAT = products.filter((p) => p.billing === "seat");

export function Usage() {
  const [metric, setMetric] = useState<"activeUsers" | "sessions">("activeUsers");
  const t = orgTotals();
  const s = seriesByProduct(metric, 90, SEAT.map((p) => p.id));
  const summaries = products.map((p) => productSummary(p.id));
  const byPerson = new Map<string, { tokens: number; sessions: number; tools: Set<string> }>();
  personUsage.forEach((u) => {
    const e = byPerson.get(u.personId) ?? { tokens: 0, sessions: 0, tools: new Set<string>() };
    e.tokens += u.tokens30; e.sessions += u.sessions30; if (u.sessions30 > 0) e.tools.add(u.productId);
    byPerson.set(u.personId, e);
  });
  const heavy = [...byPerson.entries()].sort((a, b) => b[1].tokens - a[1].tokens).slice(0, 12);
  const multi = [...byPerson.values()].filter((v) => v.tools.size >= 3).length;

  const adoption = (deptId: string, productId: string) => {
    const ids = new Set(people.filter((p) => p.deptId === deptId).map((p) => p.id));
    const lic = licenses.filter((l) => l.productId === productId && ids.has(l.personId));
    if (!lic.length) return null;
    return lic.filter((l) => l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30).length / lic.length;
  };
  const heatColor = (v: number) => `color-mix(in srgb, var(--accent) ${Math.round(12 + v * 70)}%, var(--surface))`;

  return (
    <div className="page">
      <PageHead title="שימוש ואימוץ" sub="מי משתמש, באיזה כלי ובאיזו עוצמה. מבוסס על נתוני פעילות למשתמש מכל ספק, עם זהות מאוחדת לפי ספק הזהות." />
      <div className="kpis">
        <Kpi label="עובדים פעילים" value={t.activeUsers} sub={`${pct(t.activeUsers / t.headcount)} מהעובדים`} />
        <Kpi label="Sessions ב-30 יום" value={compact(t.sessions30)} delta={t.sessions30 / t.sessionsPrev - 1} goodWhen="none" />
        <Kpi label="Tokens ב-30 יום" value={compact(t.tokens30)} delta={t.tokens30 / t.tokensPrev - 1} goodWhen="none" />
        <Kpi label="משתמשים ב-3 כלים ומעלה" value={multi} sub="פוטנציאל לחפיפה" />
      </div>
      <Panel title={metric === "activeUsers" ? "משתמשים פעילים יומיים לפי כלי" : "Sessions יומיים לפי כלי"} sub="כלים בתשלום לפי מושב · 90 יום" action={<Seg label="מדד" value={metric} onChange={setMetric} options={[{ value: "activeUsers", label: "משתמשים" }, { value: "sessions", label: "Sessions" }]} />}>
        <TimeChart dates={s.dates} series={s.series} stacked={false} format={compact} />
        <Legend items={s.series.map((x) => ({ label: x.label, color: x.color }))} />
      </Panel>
      <div className="grid g2">
        <Panel title="אימוץ לפי מחלקה וכלי" sub="אחוז בעלי הרישיון שפעילים ב-30 יום · ריק = אין רישיונות במחלקה">
          <div className="table-wrap">
            <table className="heat">
              <thead><tr><th>מחלקה</th>{SEAT.map((p) => <th key={p.id} style={{ textAlign: "center" }}><ProductDot id={p.id} short /></th>)}</tr></thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ textAlign: "start" }}>{d.name}</td>
                    {SEAT.map((p) => { const v = adoption(d.id, p.id); return <td key={p.id} className="h" style={{ background: v === null ? undefined : heatColor(v), color: v !== null && v > 0.75 ? "var(--accent-ink)" : undefined }}>{v === null ? "" : pct(v)}</td>; })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="ניצול רישיונות" sub="פעילים ב-30 יום מתוך המושבים המשולמים">
          <BarList items={summaries.filter((x) => x.seats).map((x) => ({ label: <ProductDot id={x.p.id} />, value: x.active, color: x.p.color, sub: `/ ${x.seats}` }))} max={Math.max(...summaries.map((x) => x.seats))} format={num} />
          <div className="divider" style={{ margin: "14px 0" }} />
          <BarList items={summaries.filter((x) => x.seats).map((x) => ({ label: x.p.name, value: x.utilization ?? 0, color: (x.utilization ?? 0) < 0.7 ? "var(--crit)" : "var(--good)" }))} max={1} format={(v) => pct(v)} />
        </Panel>
      </div>
      <Panel title="משתמשים כבדים" sub="לפי tokens ב-30 יום, בכל הכלים שמדווחים tokens">
        <DataTable rows={heavy} onRow={([id]) => go("users", id)} columns={[
          { key: "u", label: "משתמש", render: ([id]) => personById[id].name },
          { key: "d", label: "מחלקה", render: ([id]) => departments.find((d) => d.id === personById[id].deptId)!.name },
          { key: "tools", label: "כלים", render: ([, v]) => <div className="row">{[...v.tools].map((p) => <span key={p} className="pdot" title={productById[p].name}><i style={{ background: productById[p].color }} /></span>)}</div> },
          { key: "s", label: "Sessions", num: true, render: ([, v]) => num(v.sessions) },
          { key: "t", label: "Tokens", num: true, render: ([, v]) => compact(v.tokens) },
        ]} />
      </Panel>
    </div>
  );
}
