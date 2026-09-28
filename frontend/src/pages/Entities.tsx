import { useMemo, useState } from "react";
import { BarList, BudgetBar, Legend, Sparkline, TimeChart } from "../components/charts";
import { FindingRow } from "../components/FindingRow";
import { CostTypeTag, CoverageBars, DataTable, ExternalLink, Kpi, PageHead, Panel, ProductDot, Seg } from "../components/ui";
import { connections, daily, deptById, departments, licenses, people, personById, personUsage, postureChecks, productById, products } from "../data/mock";
import { compact, daysAgo, num, pct, usd, usdK } from "../lib/format";
import { go, href } from "../lib/router";
import { deptSummary, isOpen, personFootprint, postureScore, productSummary, seriesByProduct } from "../lib/selectors";
import { useStore } from "../lib/store";

const APPROVAL = { approved: ["ok", "מאושר"], review: ["warn", "בבחינה"], unapproved: ["bad", "לא מאושר"] } as const;

export function Products() {
  return (
    <div className="page">
      <PageHead title="כלי AI" sub="כל כלי מחובר: עלות, ניצול, תצורת אבטחה, כיסוי נתונים וממצאים פתוחים." />
      <div className="grid g3">
        {products.map((p) => {
          const s = productSummary(p.id);
          const spark = daily.filter((d) => d.productId === p.id).slice(-30).map((d) => d.sessions);
          const post = postureScore(p.id);
          const [cls, label] = APPROVAL[p.approved];
          return (
            <a key={p.id} className="panel" href={href("products", p.id)} style={{ color: "var(--ink)", display: "grid", gap: 12, textDecoration: "none" }}>
              <div className="spread"><h2><ProductDot id={p.id} /></h2><span className={`pill ${cls}`}>{label}</span></div>
              <div className="spread" style={{ alignItems: "flex-end" }}>
                <div><div className="label">תחזית חודשית</div><div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600 }} className="num">{usdK(s.forecast)}</div><CostTypeTag t={s.costType} /></div>
                <Sparkline values={spark} color={p.color} />
              </div>
              <div className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
                {p.seats ? <><dt>ניצול מושבים</dt><dd className="num">{s.active}/{s.seats} · {pct(s.utilization ?? 0)}</dd></> : <><dt>משתמשים / שירותים</dt><dd className="num">{s.users30}</dd></>}
                <dt>Sessions ב-30 יום</dt><dd className="num">{compact(s.sessions30)} <span className={`delta ${s.sessionsTrend >= 0 ? "up-good" : "down-bad"}`}>{s.sessionsTrend >= 0 ? "▲" : "▼"}{Math.abs(s.sessionsTrend * 100).toFixed(0)}%</span></dd>
                <dt>תצורת אבטחה</dt><dd className="num">{pct(post.score)} · {post.fail} נכשלות</dd>
                <dt>ממצאים פתוחים</dt><dd className="num">{s.openFindings.length}</dd>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const { findings } = useStore();
  const p = productById[id];
  const [filter, setFilter] = useState<"all" | "idle">("idle");
  if (!p) return <div className="page"><PageHead title="הכלי לא נמצא" /></div>;
  const s = productSummary(id);
  const conn = connections.find((c) => c.productId === id)!;
  const series = seriesByProduct(p.billing === "seat" ? "activeUsers" : "cost", 90, [id]);
  const lic = licenses.filter((l) => l.productId === id && (filter === "all" || l.lastActiveDaysAgo === null || l.lastActiveDaysAgo > 30));
  const f = findings.filter((x) => x.productIds.includes(id) && isOpen(x));
  const keysUsage = personUsage.filter((u) => u.productId === id);

  return (
    <div className="page">
      <PageHead crumbs={<a href={href("products")}>כלי AI</a>} title={p.name} sub={`${p.vendor} · ${p.billing === "seat" ? `רישיון למושב, ${usd(p.seatPrice!)} לחודש` : "חיוב לפי שימוש"}`} action={<ExternalLink url={p.consoleUrl} label="לקונסולת הניהול" />} />
      <div className="kpis">
        <Kpi label="תחזית חודשית" value={usdK(s.forecast)} delta={s.forecast / s.prev - 1} sub="מול חודש קודם" />
        {p.seats ? <Kpi label="ניצול מושבים" value={pct(s.utilization ?? 0)} sub={`${s.active} פעילים מתוך ${s.seats}`} /> : <Kpi label="משתמשים ושירותים" value={s.users30} sub="30 יום" />}
        <Kpi label="Sessions ב-30 יום" value={compact(s.sessions30)} delta={s.sessionsTrend} goodWhen="none" />
        {p.id !== "m365" && <Kpi label="Tokens ב-30 יום" value={compact(s.tokens30)} />}
        <Kpi label="ממצאים פתוחים" value={f.length} />
      </div>
      <div className="grid g-main">
        <Panel title={p.billing === "seat" ? "משתמשים פעילים יומיים" : "עלות יומית"} sub="90 יום">
          <TimeChart dates={series.dates} series={series.series} stacked={false} format={p.billing === "seat" ? num : usdK} />
        </Panel>
        <Panel title="כיסוי נתונים" sub={`${conn.authMethod} · עודכן לפני ${conn.freshness}`}>
          <CoverageBars coverage={conn.coverage} />
          {conn.missing && <div className="notice" style={{ marginTop: 12 }}>{conn.missing}</div>}
        </Panel>
      </div>
      {f.length > 0 && <Panel title="ממצאים פתוחים">{f.map((x) => <FindingRow key={x.id} f={x} />)}</Panel>}
      <div className="grid g2">
        <Panel title="תצורת אבטחה">
          <div className="stack">
            {postureChecks.filter((c) => c.results[id] !== "na").map((c) => (
              <div key={c.id} className="spread"><span>{c.name}</span><span className={`pill ${c.results[id] === "pass" ? "ok" : c.results[id] === "fail" ? "bad" : "warn"}`}>{{ pass: "עובר", fail: "נכשל", unknown: "לא ידוע", na: "" }[c.results[id]]}</span></div>
            ))}
          </div>
        </Panel>
        {p.billing === "seat" ? (
          <Panel title="רישיונות" action={<Seg label="סינון" value={filter} onChange={setFilter} options={[{ value: "idle", label: "לא פעילים" }, { value: "all", label: "הכול" }]} />}>
            <DataTable rows={lic} limit={10} onRow={(l) => go("users", l.personId)} initialSort={{ key: "a", dir: -1 }} columns={[
              { key: "u", label: "משתמש", render: (l) => <>{personById[l.personId].name}{personById[l.personId].status === "offboarded" && <span className="pill bad" style={{ marginInlineStart: 6 }}>עזב/ה</span>}</> },
              { key: "d", label: "מחלקה", render: (l) => deptById[personById[l.personId].deptId].name },
              { key: "a", label: "פעילות אחרונה", num: true, render: (l) => daysAgo(l.lastActiveDaysAgo), sort: (l) => l.lastActiveDaysAgo ?? 999 },
            ]} />
          </Panel>
        ) : (
          <Panel title="עלות לפי בעלי מפתחות" sub="30 יום">
            <BarList items={keysUsage.map((u) => ({ label: personById[u.personId].name, value: u.cost30, color: p.color }))} format={usd} />
          </Panel>
        )}
      </div>
    </div>
  );
}

export function Users() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const rows = useMemo(() => people
    .filter((p) => (dept === "all" || p.deptId === dept) && (!q || p.name.includes(q) || p.email.includes(q.toLowerCase())))
    .map((p) => {
      const u = personUsage.filter((x) => x.personId === p.id);
      const l = licenses.filter((x) => x.personId === p.id);
      const last = l.reduce((m, x) => (x.lastActiveDaysAgo !== null && (m === null || x.lastActiveDaysAgo < m) ? x.lastActiveDaysAgo : m), null as number | null);
      return { p, tools: l.length, sessions: u.reduce((s, x) => s + x.sessions30, 0), cost: u.reduce((s, x) => s + x.cost30, 0), last };
    }), [q, dept]);
  const { findings } = useStore();
  const openBy = new Map<string, number>();
  findings.filter(isOpen).forEach((f) => f.personIds.forEach((id) => openBy.set(id, (openBy.get(id) ?? 0) + 1)));

  return (
    <div className="page">
      <PageHead title="משתמשים" sub="טביעת רגל חוצת-כלים לכל עובד: רישיונות, שימוש, עלות וממצאים. זהות מאוחדת לפי ספק הזהות הארגוני." />
      <Panel>
        <div className="filters" style={{ marginBottom: 10 }}>
          <input id="user-q" className="input" placeholder="חיפוש לפי שם או מייל" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
          <select id="user-dept" aria-label="מחלקה" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">כל המחלקות</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <span className="muted small">{rows.length} משתמשים</span>
        </div>
        <DataTable rows={rows} limit={25} onRow={(r) => go("users", r.p.id)} initialSort={{ key: "cost", dir: -1 }} columns={[
          { key: "n", label: "משתמש", render: (r) => <>{r.p.name}{r.p.status === "offboarded" && <span className="pill bad" style={{ marginInlineStart: 6 }}>עזב/ה</span>}</>, sort: (r) => r.p.name },
          { key: "d", label: "מחלקה", render: (r) => deptById[r.p.deptId].name, sort: (r) => r.p.deptId },
          { key: "role", label: "תפקיד", render: (r) => <span className="muted">{r.p.role}</span> },
          { key: "tools", label: "כלים", num: true, render: (r) => r.tools, sort: (r) => r.tools },
          { key: "s", label: "Sessions", num: true, render: (r) => num(r.sessions), sort: (r) => r.sessions },
          { key: "cost", label: "עלות 30 יום", num: true, render: (r) => usd(r.cost), sort: (r) => r.cost },
          { key: "last", label: "פעילות אחרונה", num: true, render: (r) => r.tools ? daysAgo(r.last) : "—", sort: (r) => r.last ?? 999 },
          { key: "f", label: "ממצאים", num: true, render: (r) => openBy.get(r.p.id) ? <span className="pill sev-high">{openBy.get(r.p.id)}</span> : "", sort: (r) => openBy.get(r.p.id) ?? 0 },
        ]} />
      </Panel>
    </div>
  );
}

export function UserDetail({ id }: { id: string }) {
  const fp = personFootprint(id);
  if (!fp.person) return <div className="page"><PageHead title="המשתמש לא נמצא" /></div>;
  const p = fp.person;
  const chatTools = fp.lic.filter((l) => productById[l.productId].category === "chat" && l.productId !== "m365");
  return (
    <div className="page">
      <PageHead crumbs={<a href={href("users")}>משתמשים</a>} title={p.name} sub={<>{p.email} · {deptById[p.deptId].name} · {p.team} · {p.role}</>}
        action={p.status === "offboarded" ? <span className="pill bad">הושבת ב-Entra ID ב-{p.offboardedAt}</span> : <span className="pill ok">פעיל ב-Entra ID</span>} />
      <div className="kpis">
        <Kpi label="עלות 30 יום" value={usd(fp.cost)} sub="רישיונות ושימוש" />
        <Kpi label="Sessions" value={num(fp.sessions)} sub="בכל הכלים" />
        <Kpi label="Tokens" value={compact(fp.tokens)} />
        <Kpi label="כלים" value={fp.lic.length + fp.usage.filter((u) => u.costType === "actual").length} />
        <Kpi label="ממצאים" value={fp.findings.length} />
      </div>
      {chatTools.length >= 2 && <div className="notice info">למשתמש/ת יש {chatTools.length} כלי צ'אט בתשלום. ראו ממצא מנויים חופפים.</div>}
      <div className="grid g2">
        <Panel title="טביעת רגל לפי כלי" sub="30 יום">
          <DataTable rows={fp.usage} columns={[
            { key: "p", label: "כלי", render: (u) => <ProductDot id={u.productId} /> },
            { key: "s", label: "Sessions", num: true, render: (u) => num(u.sessions30) },
            { key: "t", label: "Tokens", num: true, render: (u) => u.productId === "m365" ? "לא מדווח" : compact(u.tokens30) },
            { key: "c", label: "עלות", num: true, render: (u) => <>{usd(u.cost30)} <CostTypeTag t={u.costType} /></> },
          ]} />
        </Panel>
        <Panel title="רישיונות">
          <DataTable rows={fp.lic} columns={[
            { key: "p", label: "כלי", render: (l) => <ProductDot id={l.productId} /> },
            { key: "a", label: "הוקצה", render: (l) => l.assignedAt },
            { key: "l", label: "פעילות אחרונה", num: true, render: (l) => <span style={{ color: l.lastActiveDaysAgo === null || l.lastActiveDaysAgo > 30 ? "var(--crit)" : undefined }}>{daysAgo(l.lastActiveDaysAgo)}</span> },
          ]} empty="אין רישיונות" />
        </Panel>
      </div>
      {fp.findings.length > 0 && <Panel title="ממצאים שקשורים למשתמש/ת">{fp.findings.map((f) => <FindingRow key={f.id} f={f} />)}</Panel>}
    </div>
  );
}

export function Departments() {
  const rows = departments.map((d) => ({ d, ...deptSummary(d.id) }));
  return (
    <div className="page">
      <PageHead title="מחלקות ומרכזי עלות" sub="עלות, תקציב, תחזית, אימוץ ובזבוז לכל מחלקה. המבנה הארגוני מגיע מספק הזהות." />
      <Panel>
        <DataTable rows={rows} onRow={(r) => go("departments", r.d.id)} initialSort={{ key: "ratio", dir: -1 }} columns={[
          { key: "n", label: "מחלקה", render: (r) => r.d.name, sort: (r) => r.d.name },
          { key: "cc", label: "מרכז עלות", render: (r) => <span className="mono">{r.d.costCenter}</span> },
          { key: "h", label: "עובדים", num: true, render: (r) => r.headcount, sort: (r) => r.headcount },
          { key: "a", label: "פעילים", num: true, render: (r) => `${r.active} (${pct(r.active / r.headcount)})`, sort: (r) => r.active / r.headcount },
          { key: "f", label: "תחזית", num: true, render: (r) => usd(r.forecast), sort: (r) => r.forecast },
          { key: "b", label: "תקציב", num: true, render: (r) => usd(r.d.monthlyBudget), sort: (r) => r.d.monthlyBudget },
          { key: "ratio", label: "ביצוע", render: (r) => <div style={{ display: "grid", gridTemplateColumns: "80px 44px", gap: 8, alignItems: "center" }}><BudgetBar value={r.forecast} budget={r.d.monthlyBudget} /><span className="num small" style={{ color: r.forecast > r.d.monthlyBudget ? "var(--crit)" : undefined }}>{pct(r.forecast / r.d.monthlyBudget)}</span></div>, sort: (r) => r.forecast / r.d.monthlyBudget },
          { key: "idle", label: "מושבים לא פעילים", num: true, render: (r) => `${r.idleSeats} · ${usd(r.idleCost)}`, sort: (r) => r.idleCost },
        ]} />
      </Panel>
    </div>
  );
}

export function DepartmentDetail({ id }: { id: string }) {
  const { findings } = useStore();
  const d = deptById[id];
  if (!d) return <div className="page"><PageHead title="המחלקה לא נמצאה" /></div>;
  const s = deptSummary(id);
  const f = findings.filter((x) => isOpen(x) && x.deptIds.includes(id));
  const top = people.filter((p) => p.deptId === id).map((p) => personFootprint(p.id)).sort((a, b) => b.cost - a.cost).slice(0, 10);
  return (
    <div className="page">
      <PageHead crumbs={<a href={href("departments")}>מחלקות</a>} title={d.name} sub={<>מרכז עלות <span className="mono">{d.costCenter}</span> · {d.headcount} עובדים</>} />
      <div className="kpis">
        <Kpi label="תחזית חודשית" value={usd(s.forecast)} sub={`תקציב ${usd(d.monthlyBudget)}`} />
        <Kpi label="ביצוע תקציב" value={pct(s.forecast / d.monthlyBudget)} />
        <Kpi label="עובדים פעילים" value={s.active} sub={`${pct(s.active / s.headcount)} מהמחלקה`} />
        <Kpi label="בזבוז" value={usd(s.idleCost)} sub={`${s.idleSeats} מושבים לא פעילים`} />
      </div>
      <div className="grid g2">
        <Panel title="עלות לפי כלי" sub="30 יום">
          <BarList items={s.byProduct.sort((a, b) => b.cost - a.cost).map((x) => ({ label: <ProductDot id={x.id} />, value: x.cost, color: productById[x.id].color }))} format={usd} />
          <Legend items={[{ label: "רישיונות לפי מחיר חוזה, API לפי חיוב בפועל", color: "var(--line)" }]} />
        </Panel>
        <Panel title="העובדים עם העלות הגבוהה ביותר">
          <DataTable rows={top} onRow={(r) => go("users", r.person.id)} columns={[
            { key: "n", label: "משתמש", render: (r) => r.person.name },
            { key: "t", label: "כלים", num: true, render: (r) => r.lic.length },
            { key: "c", label: "עלות", num: true, render: (r) => usd(r.cost) },
          ]} />
        </Panel>
      </div>
      {f.length > 0 && <Panel title="ממצאים פתוחים במחלקה">{f.map((x) => <FindingRow key={x.id} f={x} />)}</Panel>}
    </div>
  );
}
