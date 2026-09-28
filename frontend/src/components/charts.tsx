import { useMemo, useRef, useState, type ReactNode } from "react";
import { shortDate } from "../lib/format";

export interface Series { id: string; label: string; color: string; values: number[] }

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

// Time runs left to right even in the RTL UI, matching how Hebrew business charts are read.
export function TimeChart({ dates, series, stacked = true, height = 230, format, markers = [] }: {
  dates: string[]; series: Series[]; stacked?: boolean; height?: number; format: (n: number) => string;
  markers?: { index: number; label: string }[];
}) {
  const W = 760, H = height, padL = 52, padR = 12, padT = 12, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { layers, max } = useMemo(() => {
    const acc = dates.map(() => 0);
    const layers = series.map((s) => {
      const base = [...acc];
      const top = s.values.map((v, i) => (stacked ? (acc[i] += v) : v));
      return { s, base: stacked ? base : dates.map(() => 0), top };
    });
    const peak = Math.max(...layers.flatMap((l) => l.top), 0);
    return { layers, max: niceMax(peak * 1.05) };
  }, [dates, series, stacked]);

  const x = (i: number) => padL + (dates.length === 1 ? 0 : (i / (dates.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(dates.length / 7);

  const onMove = (e: React.MouseEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - padL) / iw) * (dates.length - 1));
    setHover(i >= 0 && i < dates.length ? i : null);
  };

  return (
    <div ref={wrap} style={{ position: "relative" }} dir="ltr" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="גרף לאורך זמן">
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        {dates.map((d, i) => (i % labelEvery === 0 || i === dates.length - 1) && (i === dates.length - 1 || dates.length - 1 - i >= labelEvery / 2) ? <text key={d} x={x(i)} y={H - 6} textAnchor="middle">{shortDate(d)}</text> : null)}
        {markers.map((m) => (
          <g key={m.label}>
            <line x1={x(m.index)} x2={x(m.index)} y1={padT} y2={padT + ih} stroke="var(--crit)" strokeDasharray="3 3" />
            <text x={x(m.index) + 4} y={padT + 10} style={{ fill: "var(--crit)" }}>{m.label}</text>
          </g>
        ))}
        {layers.map(({ s, base, top }) => {
          const line = top.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
          const back = base.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse();
          const area = `${line}L${back.join("L")}Z`;
          return (
            <g key={s.id}>
              <path d={area} fill={s.color} fillOpacity={stacked ? 0.78 : 0.1} stroke="none" />
              <path d={line} fill="none" stroke={s.color} strokeWidth={stacked ? 1 : 2} />
            </g>
          );
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--ink)" strokeOpacity={0.35} />}
      </svg>
      {hover !== null && (
        <div className="chart-tip" dir="rtl" style={{ top: 8, [hover > dates.length / 2 ? "left" : "right"]: 8 }}>
          <b>{shortDate(dates[hover])}</b>
          {series.map((s) => <div key={s.id}><span className="pdot"><i style={{ background: s.color }} />{s.label}</span><span className="num">{format(s.values[hover])}</span></div>)}
          {stacked && series.length > 1 && <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 4 }}><span>סה״כ</span><b className="num">{format(series.reduce((t, s) => t + s.values[hover], 0))}</b></div>}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return <div className="legend">{items.map((i) => <span key={i.label} className="pdot"><i style={{ background: i.color }} />{i.label}</span>)}</div>;
}

export function Sparkline({ values, color = "var(--accent)", width = 110, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / (max - min || 1)) * (height - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: "block" }}>
      <path d={`${d}L${last[0]},${height}L2,${height}Z`} fill={color} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}

export function BarList({ items, format, max }: { items: { label: ReactNode; value: number; color?: string; sub?: ReactNode; segments?: { value: number; color: string; label: string }[] }[]; format: (n: number) => string; max?: number }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="barlist">
      {items.map((it, idx) => (
        <div className="barrow" key={idx}>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
          <span className="track">
            {it.segments
              ? it.segments.map((s) => <i key={s.label} title={`${s.label}: ${format(s.value)}`} style={{ width: `${(s.value / top) * 100}%`, background: s.color }} />)
              : <i style={{ width: `${(it.value / top) * 100}%`, background: it.color ?? "var(--accent)" }} />}
          </span>
          <span className="val">{format(it.value)}{it.sub && <span className="muted small"> {it.sub}</span>}</span>
        </div>
      ))}
    </div>
  );
}

export function BudgetBar({ value, budget }: { value: number; budget: number }) {
  const scale = Math.max(value, budget) * 1.1;
  return (
    <div className="budget-track" title={`תחזית ${Math.round(value)} מתוך תקציב ${Math.round(budget)}`}>
      <i className={value > budget ? "over" : ""} style={{ width: `${(value / scale) * 100}%` }} />
      <b style={{ insetInlineStart: `${(budget / scale) * 100}%` }} />
    </div>
  );
}

export function Donut({ parts, size = 120, center }: { parts: { value: number; color: string; label: string }[]; size?: number; center?: ReactNode }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = size / 2 - 10, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={14} />
        {parts.map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={14} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>}
    </div>
  );
}
