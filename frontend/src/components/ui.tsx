import { useMemo, useState, type ReactNode } from "react";
import { productById } from "../data/mock";
import type { Capability, CostType, FindingStatus, Severity } from "../data/types";
import { Icon } from "./icons";

export const SEV_LABEL: Record<Severity, string> = { critical: "קריטי", high: "גבוה", medium: "בינוני", low: "נמוך" };
export const STATUS_LABEL: Record<FindingStatus, string> = { open: "פתוח", in_progress: "בטיפול", resolved: "טופל", accepted: "סיכון מקובל", dismissed: "לא רלוונטי" };
export const CAT_LABEL = { cost: "עלויות", security: "אבטחה", usage: "שימוש", data: "איכות נתונים" } as const;
export const CAP_LABEL: Record<Capability, string> = { users: "משתמשים", usage: "שימוש", cost: "עלות", sessions: "Sessions", audit: "Audit", content: "תוכן" };
export const COST_TYPE_LABEL: Record<CostType, string> = { actual: "בפועל", license: "רישיון (חוזה)", estimated: "הערכה" };

export function Panel({ title, sub, action, children, className = "" }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-head">
          <div>{title && <h2>{title}</h2>}{sub && <p>{sub}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, delta, goodWhen = "down" }: { label: string; value: ReactNode; sub?: ReactNode; delta?: number; goodWhen?: "up" | "down" | "none" }) {
  let cls = "flat";
  if (delta !== undefined && Math.abs(delta) >= 0.005 && goodWhen !== "none") {
    const up = delta > 0;
    cls = up ? (goodWhen === "up" ? "up-good" : "up-bad") : goodWhen === "down" ? "down-good" : "down-bad";
  }
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className="v">{value}</span>
      <span className="sub">
        {delta !== undefined && <span className={`delta ${cls}`}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}% </span>}
        {sub}
      </span>
    </div>
  );
}

export const SevPill = ({ s }: { s: Severity }) => <span className={`pill sev-${s}`}>{SEV_LABEL[s]}</span>;
export const StatusPill = ({ s }: { s: FindingStatus }) => <span className={`pill st-${s}`}>{STATUS_LABEL[s]}</span>;
export const CostTypeTag = ({ t }: { t: CostType }) => <span className="tag" title={t === "estimated" ? "הערכה, לא נתון רשמי מהספק" : undefined}>{COST_TYPE_LABEL[t]}</span>;

export function ProductDot({ id, short = false }: { id: string; short?: boolean }) {
  const p = productById[id];
  return <span className="pdot"><i style={{ background: p.color }} />{short ? p.name.split(" ")[0] : p.name}</span>;
}

export function CoverageBars({ coverage }: { coverage: Record<Capability, number> }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {(Object.keys(CAP_LABEL) as Capability[]).map((c) => (
        <div className="cov" key={c}>
          <span>{CAP_LABEL[c]}</span>
          <span className={`cov-bar ${coverage[c] === 0 ? "zero" : ""}`} title={coverage[c] === 0 ? "הספק לא חושף נתון זה, או שאין הרשאה" : undefined}><i style={{ width: `${coverage[c]}%` }} /></span>
          <span className="num small muted">{coverage[c] === 0 ? "—" : `${coverage[c]}%`}</span>
        </div>
      ))}
    </div>
  );
}

export function Confidence({ value }: { value: number }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="spread small"><span>ביטחון</span><b className="num">{Math.round(value * 100)}%</b></div>
      <div className="conf"><i style={{ width: `${value * 100}%` }} /></div>
    </div>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sort?: (row: T) => number | string;
  num?: boolean;
}

export function DataTable<T>({ rows, columns, onRow, initialSort, limit, empty = "אין נתונים" }: { rows: T[]; columns: Column<T>[]; onRow?: (row: T) => void; initialSort?: { key: string; dir: 1 | -1 }; limit?: number; empty?: string }) {
  const [sort, setSort] = useState(initialSort);
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sort!(a), y = col.sort!(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, columns, sort]);
  const visible = limit && !showAll ? sorted.slice(0, limit) : sorted;
  if (!rows.length) return <div className="empty">{empty}</div>;
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`${c.num ? "num" : ""} ${c.sort ? "sortable" : ""}`} onClick={() => c.sort && setSort((s) => ({ key: c.key, dir: s?.key === c.key ? ((s.dir * -1) as 1 | -1) : -1 }))} aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                  {c.label}{sort?.key === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className={onRow ? "clickable" : ""} onClick={() => onRow?.(r)}>
                {columns.map((c) => <td key={c.key} className={c.num ? "num" : ""}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && rows.length > limit && (
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => setShowAll((v) => !v)}>{showAll ? "הצג פחות" : `הצג את כל ${rows.length} השורות`}</button>
        </div>
      )}
    </>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`toggle ${on ? "on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function PageHead({ title, sub, crumbs, action }: { title: ReactNode; sub?: ReactNode; crumbs?: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action && <div className="row">{action}</div>}
    </div>
  );
}

export function ExternalLink({ url, label }: { url: string; label: string }) {
  const internal = url.startsWith("#");
  return (
    <a className="btn primary" href={url} target={internal ? undefined : "_blank"} rel="noreferrer">
      {label} <Icon name={internal ? "back" : "external"} size={14} />
    </a>
  );
}
