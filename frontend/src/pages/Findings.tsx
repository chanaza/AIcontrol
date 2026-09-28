import { useMemo, useState } from "react";
import { FindingRow } from "../components/FindingRow";
import { Icon } from "../components/icons";
import { CAT_LABEL, Confidence, DataTable, ExternalLink, Kpi, PageHead, Panel, ProductDot, Seg, SevPill, STATUS_LABEL, StatusPill } from "../components/ui";
import { deptById, personById, products } from "../data/mock";
import type { Finding, FindingCategory, FindingStatus, Severity } from "../data/types";
import { dateTime, usd, usdK } from "../lib/format";
import { href } from "../lib/router";
import { findingStats, isOpen } from "../lib/selectors";
import { useStore } from "../lib/store";

const SEV_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function Findings() {
  const { findings } = useStore();
  const [cat, setCat] = useState<"all" | FindingCategory>("all");
  const [status, setStatus] = useState<"open" | "all" | "closed">("open");
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [prod, setProd] = useState("all");
  const [sort, setSort] = useState<"severity" | "impact" | "date">("severity");

  const list = useMemo(() => findings
    .filter((f) => cat === "all" || f.category === cat)
    .filter((f) => status === "all" || (status === "open" ? isOpen(f) : !isOpen(f)))
    .filter((f) => sev === "all" || f.severity === sev)
    .filter((f) => prod === "all" || f.productIds.includes(prod))
    .sort((a, b) => sort === "impact" ? (b.impact.usdMonthly ?? 0) - (a.impact.usdMonthly ?? 0)
      : sort === "date" ? b.detectedAt.localeCompare(a.detectedAt)
      : SEV_RANK[a.severity] - SEV_RANK[b.severity] || (b.impact.usdMonthly ?? 0) - (a.impact.usdMonthly ?? 0)), [findings, cat, status, sev, prod, sort]);
  const st = findingStats(findings);
  const count = (c: FindingCategory) => findings.filter((f) => isOpen(f) && f.category === c).length;

  return (
    <div className="page">
      <PageHead title="ממצאים והמלצות" sub="כל ממצא כולל ראיות, השפעה, בעלים, צעדי טיפול בכלי עצמו וביטחון. המערכת מאמתת בסנכרון הבא שהבעיה נפתרה." />
      <div className="kpis">
        <Kpi label="פתוחים" value={st.open} sub={`${st.bySev.critical} קריטיים · ${st.bySev.high} גבוהים`} />
        <Kpi label="חיסכון זמין" value={usdK(st.savings)} sub="לחודש" />
        <Kpi label="עלויות" value={count("cost")} sub="ממצאים פתוחים" />
        <Kpi label="אבטחה" value={count("security")} sub="ממצאים פתוחים" />
        <Kpi label="שימוש ואיכות נתונים" value={count("usage") + count("data")} sub="ממצאים פתוחים" />
      </div>
      <Panel>
        <div className="filters" style={{ marginBottom: 8 }}>
          <Seg label="קטגוריה" value={cat} onChange={setCat} options={[{ value: "all", label: "הכול" }, ...(Object.keys(CAT_LABEL) as FindingCategory[]).map((c) => ({ value: c, label: CAT_LABEL[c] }))]} />
          <Seg label="סטטוס" value={status} onChange={setStatus} options={[{ value: "open", label: "פתוחים" }, { value: "closed", label: "סגורים" }, { value: "all", label: "הכול" }]} />
          <select id="f-sev" aria-label="חומרה" value={sev} onChange={(e) => setSev(e.target.value as typeof sev)}>
            <option value="all">כל החומרות</option><option value="critical">קריטי</option><option value="high">גבוה</option><option value="medium">בינוני</option><option value="low">נמוך</option>
          </select>
          <select id="f-prod" aria-label="כלי" value={prod} onChange={(e) => setProd(e.target.value)}>
            <option value="all">כל הכלים</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ flex: 1 }} />
          <select id="f-sort" aria-label="מיון" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="severity">מיון: חומרה</option><option value="impact">מיון: השפעה כספית</option><option value="date">מיון: הכי חדשים</option>
          </select>
        </div>
        {list.length ? list.map((f) => <FindingRow key={f.id} f={f} />) : <div className="empty">אין ממצאים שתואמים לסינון.</div>}
      </Panel>
    </div>
  );
}

const ACTIONS: { status: FindingStatus; label: string }[] = [
  { status: "in_progress", label: "העבר לטיפול" }, { status: "resolved", label: "סמן כטופל" },
  { status: "accepted", label: "סיכון מקובל" }, { status: "dismissed", label: "לא רלוונטי" }, { status: "open", label: "פתח מחדש" },
];

async function copy(text: string, notify: (m: string) => void, what: string) {
  try { await navigator.clipboard.writeText(text); notify(`${what} הועתק`); } catch { notify("ההעתקה נחסמה בדפדפן. סמנו את הטקסט והעתיקו ידנית."); }
}

export function FindingDetail({ id }: { id: string }) {
  const { findings, history, setStatus, notify } = useStore();
  const f = findings.find((x) => x.id === id);
  const [note, setNote] = useState("");
  if (!f) return <div className="page"><PageHead title="הממצא לא נמצא" crumbs={<a href={href("findings")}>ממצאים</a>} /></div>;
  const h = history[f.id];
  const csv = [f.evidence.columns, ...f.evidence.rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return (
    <div className="page">
      <PageHead crumbs={<><a href={href("findings")}>ממצאים</a> · {f.id} · {f.ruleId} {f.ruleName}</>} title={f.title}
        sub={<span className="row" style={{ marginTop: 4 }}><SevPill s={f.severity} /><StatusPill s={f.status} /><span className="tag">{CAT_LABEL[f.category]}</span>{f.realtime && <span className="tag">זוהה בזמן אמת</span>}<span className="small muted">זוהה {dateTime(f.detectedAt)}</span></span>} />
      <div className="fd-grid">
        <div className="grid">
          <Panel title="מה קרה">
            <p style={{ margin: 0, maxWidth: "75ch" }}>{f.summary}</p>
          </Panel>
          <Panel title="ראיות" sub={`${f.evidence.rows.length} רשומות · מקור: ${f.coverageNote}`} action={<button className="btn" onClick={() => copy(csv, notify, "CSV")}><Icon name="copy" size={14} />העתק כ-CSV</button>}>
            <DataTable rows={f.evidence.rows} limit={12} columns={f.evidence.columns.map((c, i) => ({ key: String(i), label: c, render: (r: (string | number)[]) => r[i], sort: (r: (string | number)[]) => r[i], num: typeof f.evidence.rows[0]?.[i] === "number" }))} />
          </Panel>
          <Panel title="איך מטפלים" sub="הטיפול מתבצע בכלי עצמו. המערכת לא משנה דבר בכלי ה-AI." action={<ExternalLink url={f.remediation.consoleUrl} label={f.remediation.consoleLabel} />}>
            <ol className="steps">{f.remediation.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </Panel>
          {f.message !== "—" && (
            <Panel title="נוסח פנייה מוכן" sub={`לשליחה ל${f.owner.name === "אבטחת מידע" || f.personIds.length === 1 ? "משתמש/ת או לבעלים" : "בעלי הטיפול"}`} action={<button className="btn" onClick={() => copy(f.message, notify, "הנוסח")}><Icon name="copy" size={14} />העתק</button>}>
              <pre className="msg">{f.message}</pre>
            </Panel>
          )}
        </div>
        <div className="grid">
          <Panel title="השפעה">
            <div className="fd-facts">
              {f.impact.usdMonthly !== undefined && <div className="fact"><span className="label">כספית</span><span className="v num" style={{ fontSize: 20, fontFamily: "var(--font-display)" }}>{usd(f.impact.usdMonthly)} לחודש</span><span className="small muted">{usd(f.impact.usdMonthly * 12)} בשנה</span></div>}
              {f.impact.risk && <div className="fact"><span className="label">סיכון</span><span className="v">{f.impact.risk}</span></div>}
              {f.impact.users !== undefined && <div className="fact"><span className="label">משתמשים מושפעים</span><span className="v num">{f.impact.users}</span></div>}
            </div>
          </Panel>
          <Panel title="בעלים ומעורבים">
            <div className="fd-facts">
              <div className="fact"><span className="label">אחראי/ת טיפול</span><span className="v">{f.owner.name}</span><span className="small muted">{f.owner.role}</span></div>
              {f.productIds.length > 0 && <div className="fact"><span className="label">כלים</span><div className="row">{f.productIds.map((p) => <a key={p} href={href("products", p)}><ProductDot id={p} /></a>)}</div></div>}
              {f.deptIds.length > 0 && <div className="fact"><span className="label">מחלקות</span><div className="row">{f.deptIds.slice(0, 6).map((d) => <a key={d} className="tag" href={href("departments", d)}>{deptById[d].name}</a>)}</div></div>}
              {f.personIds.length > 0 && <div className="fact"><span className="label">משתמשים</span><div className="row">{f.personIds.slice(0, 5).map((p) => <a key={p} href={href("users", p)} className="small">{personById[p].name}</a>)}{f.personIds.length > 5 && <span className="small muted">ועוד {f.personIds.length - 5}</span>}</div></div>}
            </div>
          </Panel>
          <Panel title="ביטחון וכיסוי">
            <div className="stack"><Confidence value={f.confidence} /><span className="small muted">{f.coverageNote}</span></div>
          </Panel>
          <Panel title="מחזור חיים">
            <div className="stack">
              <div className="row">{ACTIONS.filter((a) => a.status !== f.status && (a.status !== "open" || !isOpen(f))).map((a) => (
                <button key={a.status} className={`btn ${a.status === "resolved" ? "primary" : ""}`} onClick={() => { setStatus(f.id, a.status, note || undefined); setNote(""); notify(`הסטטוס עודכן: ${STATUS_LABEL[a.status]}`); }}>{a.label}</button>
              ))}</div>
              <textarea id="finding-note" className="input" rows={2} placeholder="הערה (לא חובה), למשל מספר כרטיס" value={note} onChange={(e) => setNote(e.target.value)} />
              <ul className="timeline">
                <li className="done"><span>{dateTime(f.detectedAt)} · זוהה על ידי כלל {f.ruleId}</span></li>
                <li className="done"><span>{dateTime(f.detectedAt)} · התראה נשלחה ל-{f.severity === "critical" ? "Slack #sec-alerts ולמייל" : "סיכום יומי"}</span></li>
                {f.status === "in_progress" && !h && <li className="done"><span>הוקצה ל-{f.owner.name}</span></li>}
                {h && <li className="done"><span>{dateTime(h.at)} · {STATUS_LABEL[h.status]}{h.note ? ` · ${h.note}` : ""}</span></li>}
                <li><span className="muted">{f.verification}</span></li>
              </ul>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export type { Finding };
