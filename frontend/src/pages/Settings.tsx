import { useState } from "react";
import { PageHead, Panel, ProductDot, Toggle } from "../components/ui";
import { connections, departments, products } from "../data/mock";
import { useStore } from "../lib/store";

const POLICIES = [
  { id: "p1", name: "PII אסור בכלים חיצוניים", scope: "כל כלי הצ'אט", detects: "ת\"ז, כרטיס אשראי, חשבון בנק, טלפון" },
  { id: "p2", name: "אין להדביק סודות וקוד תשתית", scope: "כל הכלים", detects: "מפתחות ענן, סיסמאות, מחרוזות חיבור" },
  { id: "p3", name: "קוד מקור רק בכלי קוד מאושרים", scope: "כלי צ'אט", detects: "קוד מקור מהמאגרים הארגוניים" },
  { id: "p4", name: "מסמכים מסווגים רק ב-workspace משפטי", scope: "Claude Enterprise", detects: "תוויות \"סודי\" ו\"סודי ביותר\"" },
];
const ROLES = [
  { role: "מנהל/ת מערכת", can: "חיבורים, הגדרות, כל הנתונים" },
  { role: "אנליסט/ית", can: "כל המסכים, בלי תוכן לא מושחר" },
  { role: "כספים", can: "עלויות, תקציבים, מחלקות" },
  { role: "סוקר/ת תוכן", can: "צפייה בתוכן מלא. כל צפייה נרשמת ביומן" },
];

export function Settings() {
  const { notify } = useStore();
  const [pol, setPol] = useState<Record<string, boolean>>({ p1: true, p2: true, p3: true, p4: false });
  const [content, setContent] = useState<Record<string, boolean>>(Object.fromEntries(connections.map((c) => [c.productId, c.contentEnabled])));
  const saved = () => notify("נשמר (הדגמה)");
  return (
    <div className="page">
      <PageHead title="הגדרות ומדיניות" sub="מדיניות לניתוח, שמירת נתונים, תקציבים וקטלוג כלים. ההגדרות משפיעות רק על הניתוח במערכת, לא על כלי ה-AI עצמם." />
      <div className="grid g2">
        <Panel title="מדיניות לניתוח תוכן" sub="כללים שמולם נבדק תוכן, בכלים שבהם האיסוף מופעל">
          {POLICIES.map((p) => (
            <div key={p.id} className="setting"><div><b style={{ fontWeight: 500 }}>{p.name}</b><div className="small muted">{p.scope} · מזהה: {p.detects}</div></div><Toggle on={pol[p.id]} label={p.name} onChange={(v) => { setPol({ ...pol, [p.id]: v }); saved(); }} /></div>
          ))}
        </Panel>
        <Panel title="איסוף תוכן לפי חיבור" sub="כבוי כברירת מחדל. זמין רק כשהספק חושף תוכן דרך API רשמי">
          {connections.map((c) => (
            <div key={c.productId} className="setting"><ProductDot id={c.productId} />{c.coverage.content === 0 ? <span className="small muted">לא זמין אצל הספק</span> : <Toggle on={content[c.productId]} label="איסוף תוכן" onChange={(v) => { setContent({ ...content, [c.productId]: v }); saved(); }} />}</div>
          ))}
        </Panel>
        <Panel title="שמירת נתונים" sub="לכל שכבה תקופת שמירה משלה">
          {[["נתונים גולמיים מהספק", ["30", "90", "180"], "90"], ["נתוני שימוש מנורמלים", ["365", "730", "1095"], "730"], ["מדדים מצטברים", ["ללא הגבלה"], "ללא הגבלה"], ["תוכן שיחות", ["30", "90"], "30"]].map(([name, opts, def]) => (
            <div key={name as string} className="setting"><span>{name as string}</span>
              <select id={`ret-${name}`} defaultValue={def as string} onChange={saved} aria-label={name as string}>{(opts as string[]).map((o) => <option key={o} value={o}>{/\d/.test(o) ? `${o} ימים` : o}</option>)}</select>
            </div>
          ))}
        </Panel>
        <Panel title="תקציב AI חודשי לפי מחלקה">
          {departments.map((d) => (
            <div key={d.id} className="setting"><span>{d.name} <span className="mono muted small">{d.costCenter}</span></span>
              <input id={`budget-${d.id}`} className="input num" style={{ width: 110, textAlign: "end" }} defaultValue={d.monthlyBudget} onBlur={saved} aria-label={`תקציב ${d.name}`} inputMode="numeric" />
            </div>
          ))}
        </Panel>
        <Panel title="קטלוג כלים ומחירי חוזה" sub="סטטוס האישור משמש את כלל S8. המחיר משמש לחישובי רישיונות">
          {products.map((p) => (
            <div key={p.id} className="setting"><ProductDot id={p.id} />
              <span className="row">
                {p.seatPrice && <input id={`price-${p.id}`} className="input num" style={{ width: 70, textAlign: "end" }} defaultValue={p.seatPrice} onBlur={saved} aria-label={`מחיר ${p.name}`} />}
                <select id={`appr-${p.id}`} defaultValue={p.approved} onChange={saved} aria-label={`סטטוס ${p.name}`}><option value="approved">מאושר</option><option value="review">בבחינה</option><option value="unapproved">לא מאושר</option></select>
              </span>
            </div>
          ))}
        </Panel>
        <Panel title="הרשאות במערכת" sub="RBAC. בגרסת הייצור: SSO/SAML ו-SCIM">
          {ROLES.map((r) => <div key={r.role} className="setting"><b style={{ fontWeight: 500 }}>{r.role}</b><span className="small muted">{r.can}</span></div>)}
        </Panel>
      </div>
    </div>
  );
}
