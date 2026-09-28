import type { Finding } from "../data/types";
import { productById } from "../data/mock";
import { usd } from "../lib/format";
import { href } from "../lib/router";
import { CAT_LABEL, SevPill, StatusPill } from "./ui";

export function FindingRow({ f, compact = false }: { f: Finding; compact?: boolean }) {
  return (
    <a className="frow" href={href("findings", f.id)}>
      <span className={`stripe ${f.severity}`} />
      <div style={{ minWidth: 0 }}>
        <div className="ftitle">{f.title}</div>
        <div className="fmeta">
          <SevPill s={f.severity} />
          {!compact && <StatusPill s={f.status} />}
          <span>{CAT_LABEL[f.category]} · {f.ruleId}</span>
          {f.productIds.slice(0, 2).map((p) => <span key={p} className="pdot"><i style={{ background: productById[p].color }} />{productById[p].name}</span>)}
          {f.realtime && <span className="tag">זוהה בזמן אמת</span>}
          {!compact && <span>בעלים: {f.owner.name}</span>}
        </div>
      </div>
      <div className="fimpact">
        {f.impact.usdMonthly ? <><b>{usd(f.impact.usdMonthly)}</b><span>לחודש</span></> : f.impact.users ? <><b>{f.impact.users}</b><span>משתמשים</span></> : <span>סיכון</span>}
      </div>
    </a>
  );
}
