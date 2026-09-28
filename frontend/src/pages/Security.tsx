import { FindingRow } from "../components/FindingRow";
import { DataTable, Kpi, PageHead, Panel, ProductDot } from "../components/ui";
import { apiKeys, auditEvents, connections, detections, licenses, personById, postureChecks, productById, products } from "../data/mock";
import { dateTime, daysAgo, pct, usd } from "../lib/format";
import { go, href } from "../lib/router";
import { isOpen, postureScore } from "../lib/selectors";
import { useStore } from "../lib/store";

const CELL = { pass: "✓", fail: "✕", unknown: "?", na: "·" } as const;

export function Security() {
  const { findings } = useStore();
  const posture = postureScore();
  const sec = findings.filter((f) => isOpen(f) && f.category === "security");
  const leavers = new Set(licenses.filter((l) => personById[l.personId].status === "offboarded").map((l) => l.personId));
  const riskyKeys = apiKeys.filter((k) => !k.ownerId || personById[k.ownerId].status === "offboarded" || k.scope === "All permissions");
  const contentProducts = connections.filter((c) => c.coverage.content > 0);

  return (
    <div className="page">
      <PageHead title="אבטחה ומדיניות" sub="ניתוח בזמן אמת ובדיעבד של תצורות, פעולות מנהלים, גישות ותוכן, בגבולות מה שכל ספק חושף. המערכת לא חוסמת ולא משנה דבר." />
      <div className="kpis">
        <Kpi label="ציון תצורת אבטחה" value={pct(posture.score)} sub={`${posture.fail} נכשלות · ${posture.unknown} לא ידועות`} />
        <Kpi label="ממצאי אבטחה פתוחים" value={sec.length} sub={`${sec.filter((f) => f.severity === "critical").length} קריטיים`} />
        <Kpi label="זיהויי מידע רגיש" value={detections.length} sub="7 ימים אחרונים" />
        <Kpi label="פעולות מנהל חריגות" value={auditEvents.filter((a) => a.anomalous).length} sub="7 ימים אחרונים" />
        <Kpi label="עובדים שעזבו עם גישה" value={leavers.size} sub="מוצלב מול Entra ID" />
        <Kpi label="מפתחות API בסיכון" value={riskyKeys.length} sub={`מתוך ${apiKeys.length}`} />
      </div>

      <Panel title="ממצאי אבטחה פתוחים">
        {sec.map((f) => <FindingRow key={f.id} f={f} />)}
      </Panel>

      <Panel title="תצורת אבטחה (posture) לפי כלי" sub="✓ עובר · ✕ נכשל · ? לא ידוע (אין הרשאה או שהספק לא חושף) · נקודה = לא רלוונטי לכלי">
        <div className="table-wrap">
          <table className="matrix">
            <thead><tr><th>בדיקה</th>{products.map((p) => <th key={p.id} title={p.name}><ProductDot id={p.id} short /></th>)}</tr></thead>
            <tbody>
              {postureChecks.map((c) => (
                <tr key={c.id}>
                  <td><b style={{ fontWeight: 500 }}>{c.name}</b><div className="small muted">{c.description}</div></td>
                  {products.map((p) => <td key={p.id}><span className={`cell ${c.results[p.id]}`} title={c.results[p.id]}>{CELL[c.results[p.id]]}</span></td>)}
                </tr>
              ))}
              <tr>
                <td className="muted small">ציון</td>
                {products.map((p) => <td key={p.id} className="num small">{pct(postureScore(p.id).score)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid g2">
        <Panel title="מידע רגיש בתוכן" sub={`נותח ב-${contentProducts.length} כלים שבהם הספק חושף תוכן והארגון הפעיל איסוף. בשאר הכלים התוכן לא זמין, והמערכת לא טוענת אחרת.`}>
          <DataTable rows={detections} columns={[
            { key: "at", label: "זמן", render: (d) => dateTime(d.at), sort: (d) => d.at },
            { key: "p", label: "כלי", render: (d) => <ProductDot id={d.productId} short /> },
            { key: "u", label: "משתמש", render: (d) => <a href={href("users", d.personId)}>{personById[d.personId].name}</a> },
            { key: "e", label: "ישות", render: (d) => d.entity },
            { key: "n", label: "כמות", num: true, render: (d) => d.count, sort: (d) => d.count },
            { key: "pol", label: "מדיניות", render: (d) => d.policy ? <span className="pill bad">הפרה</span> : <span className="pill neutral">מידע</span> },
          ]} />
          <div className="row small muted" style={{ marginTop: 10 }}>
            <span>נתונים זמינים / נותחו:</span>
            {connections.map((c) => <span key={c.productId} className="tag">{productById[c.productId].name.split(" ")[0]}: {c.coverage.content ? (c.contentEnabled ? "זמין · נותח" : "זמין · כבוי") : "לא זמין"}</span>)}
          </div>
        </Panel>
        <Panel title="פעולות מנהלים ביומני audit" sub="פעולות שסומנו כחריגות מופיעות עם הסבר">
          <div className="feed">
            {auditEvents.map((a) => (
              <div key={a.id} className="feed-item">
                <span className="t">{dateTime(a.at)}</span>
                <span className={`stripe ${a.anomalous ? "high" : ""}`} style={{ background: a.anomalous ? undefined : "var(--line)" }} />
                <span>
                  <b style={{ fontWeight: 500 }}>{a.action}</b> · {a.target}
                  <br /><span className="muted small">{a.actor} · {productById[a.productId].name}</span>
                  {a.reason && <><br /><span className="small" style={{ color: "var(--high)" }}>{a.reason}</span></>}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="מפתחות API" sub="מקור: Admin API של הספקים, מוצלב עם ספק הזהות">
        <DataTable rows={apiKeys} initialSort={{ key: "cost", dir: -1 }} columns={[
          { key: "n", label: "מפתח", render: (k) => <span className="mono">{k.name}</span>, sort: (k) => k.name },
          { key: "p", label: "כלי", render: (k) => <ProductDot id={k.productId} /> },
          { key: "o", label: "בעלים", render: (k) => !k.ownerId ? <span className="pill bad">ללא בעלים</span> : personById[k.ownerId].status === "offboarded" ? <span><a href={href("users", k.ownerId)}>{personById[k.ownerId].name}</a> <span className="pill bad">עזב/ה</span></span> : <a href={href("users", k.ownerId)}>{personById[k.ownerId].name}</a> },
          { key: "s", label: "הרשאה", render: (k) => <span className={k.scope === "All permissions" ? "pill warn" : "tag"}>{k.scope}</span> },
          { key: "c", label: "נוצר", num: true, render: (k) => daysAgo(k.createdDaysAgo), sort: (k) => k.createdDaysAgo },
          { key: "u", label: "שימוש אחרון", num: true, render: (k) => daysAgo(k.lastUsedDaysAgo), sort: (k) => k.lastUsedDaysAgo },
          { key: "cost", label: "עלות 30 יום", num: true, render: (k) => usd(k.cost30), sort: (k) => k.cost30 },
        ]} />
      </Panel>

      <Panel title="עובדים שעזבו ועדיין מחזיקים גישה" sub="סטטוס מושבת ב-Entra ID, והחשבון פעיל בכלי ה-AI">
        <DataTable limit={10} rows={licenses.filter((l) => personById[l.personId].status === "offboarded")} onRow={(l) => go("users", l.personId)} columns={[
          { key: "u", label: "משתמש", render: (l) => personById[l.personId].name },
          { key: "d", label: "תאריך עזיבה", render: (l) => personById[l.personId].offboardedAt!, sort: (l) => personById[l.personId].offboardedAt! },
          { key: "p", label: "כלי", render: (l) => <ProductDot id={l.productId} /> },
          { key: "a", label: "פעילות אחרונה", num: true, render: (l) => daysAgo(l.lastActiveDaysAgo), sort: (l) => l.lastActiveDaysAgo ?? 999 },
        ]} />
      </Panel>
    </div>
  );
}
