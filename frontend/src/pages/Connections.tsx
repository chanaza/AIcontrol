import { useState } from "react";
import { Icon } from "../components/icons";
import { CAP_LABEL, CoverageBars, PageHead, Panel, ProductDot, Toggle } from "../components/ui";
import { connections, productById } from "../data/mock";
import type { Capability } from "../data/types";
import { useStore } from "../lib/store";

const STATUS = { healthy: ["ok", "תקין"], degraded: ["bad", "נכשל"], error: ["bad", "שגיאה"], not_connected: ["neutral", "לא מחובר"] } as const;

interface VendorOption { id: string; name: string; auth: "key" | "oauth" | "app"; fields: string[]; caps: Record<Capability, boolean>; note: string }
// Capabilities per vendor are prototype assumptions until the official-API research (plan, stage 1) confirms them.
const VENDORS: VendorOption[] = [
  { id: "claude", name: "Claude Enterprise", auth: "key", fields: ["Admin API key", "Compliance API key (לא חובה)"], caps: { users: true, usage: true, cost: true, sessions: true, audit: true, content: true }, note: "מפתחות נוצרים בקונסולת Claude על ידי בעלי הארגון." },
  { id: "chatgpt", name: "ChatGPT Enterprise", auth: "key", fields: ["Workspace ID", "Admin / Compliance API key"], caps: { users: true, usage: true, cost: false, sessions: true, audit: true, content: true }, note: "Compliance API דורש הפעלה מול OpenAI בתוכנית Enterprise." },
  { id: "m365", name: "Microsoft 365 Copilot", auth: "oauth", fields: [], caps: { users: true, usage: true, cost: false, sessions: true, audit: true, content: true }, note: "נדרש מנהל גלובלי ב-Entra ID כדי לאשר הרשאות (admin consent)." },
  { id: "ghcopilot", name: "GitHub Copilot", auth: "app", fields: [], caps: { users: true, usage: true, cost: true, sessions: false, audit: true, content: false }, note: "התקנת GitHub App על הארגון, בהרשאות קריאה בלבד." },
  { id: "gemini", name: "Google Gemini", auth: "oauth", fields: [], caps: { users: true, usage: true, cost: false, sessions: false, audit: true, content: false }, note: "חיבור דרך Google Workspace Admin (בתכנון, אחרי ה-MVP)." },
  { id: "openai-api", name: "OpenAI API", auth: "key", fields: ["Admin API key"], caps: { users: true, usage: true, cost: true, sessions: false, audit: true, content: false }, note: "מפתח Admin נפרד ממפתחות הפרויקטים." },
];

function Wizard({ onClose }: { onClose: () => void }) {
  const { notify } = useStore();
  const [step, setStep] = useState(0);
  const [vendor, setVendor] = useState<VendorOption | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [content, setContent] = useState(false);
  const [backfill, setBackfill] = useState("90");

  const test = () => { setTesting(true); window.setTimeout(() => { setTesting(false); setStep(2); }, 1100); };
  const filled = vendor && (vendor.auth !== "key" || vendor.fields.filter((f) => !f.includes("לא חובה")).every((f) => (values[f] ?? "").length > 6));

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="חיבור כלי AI" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="spread"><h2>חיבור כלי AI</h2><button className="icon-btn" onClick={onClose} aria-label="סגירה">✕</button></div>
        <div className="wizard-steps">{[0, 1, 2, 3].map((i) => <span key={i} className={i <= step ? "on" : ""} />)}</div>
        {step === 0 && (
          <>
            <p className="muted" style={{ margin: 0 }}>בחרו את הכלי. המערכת מתחברת ל-API הרשמי של הספק, בקריאה בלבד.</p>
            <div className="choice">
              {VENDORS.map((v) => <button key={v.id} className={vendor?.id === v.id ? "on" : ""} onClick={() => setVendor(v)}><b>{v.name}</b><span className="small muted">{v.auth === "key" ? "מפתח API" : v.auth === "oauth" ? "התחברות OAuth" : "GitHub App"}</span></button>)}
            </div>
            <div className="spread"><span /><button className="btn primary" disabled={!vendor} onClick={() => setStep(1)}>המשך</button></div>
          </>
        )}
        {step === 1 && vendor && (
          <>
            <div className="notice info">{vendor.note}</div>
            {vendor.auth === "key" ? vendor.fields.map((f) => (
              <div className="field" key={f}>
                <label htmlFor={`fld-${f}`}>{f}</label>
                <input id={`fld-${f}`} className="input mono" type={f.includes("key") ? "password" : "text"} value={values[f] ?? ""} onChange={(e) => setValues({ ...values, [f]: e.target.value })} placeholder={f.includes("key") ? "sk-…" : ""} autoComplete="off" />
              </div>
            )) : (
              <button className="btn primary" style={{ justifySelf: "start" }} onClick={() => setValues({ oauth: "ok" })}>{values.oauth ? "✓ ההרשאה אושרה" : vendor.auth === "oauth" ? `התחברות עם ${vendor.name.split(" ")[0]}` : "התקנת GitHub App"}</button>
            )}
            <p className="small muted" style={{ margin: 0 }}>המפתח נשמר מוצפן (envelope encryption), ולא מוצג שוב אחרי השמירה. בהתקנה אצל הלקוח, מפתח ההצפנה נשאר אצלכם.</p>
            <div className="spread"><button className="btn" onClick={() => setStep(0)}>חזרה</button><button className="btn primary" disabled={!filled && !values.oauth || testing} onClick={test}>{testing ? "בודק חיבור…" : "בדיקת חיבור"}</button></div>
          </>
        )}
        {step === 2 && vendor && (
          <>
            <div className="notice info" style={{ background: "var(--good-soft)" }}>החיבור הצליח. אלה היכולות שהמפתח וההרשאות מאפשרים בפועל:</div>
            <div className="checks">
              {(Object.keys(CAP_LABEL) as Capability[]).map((c) => <div key={c}><span className={`cell ${vendor.caps[c] ? "pass" : "na"}`}>{vendor.caps[c] ? "✓" : "—"}</span>{CAP_LABEL[c]}{!vendor.caps[c] && <span className="small muted"> · לא נחשף על ידי הספק בחיבור הזה</span>}</div>)}
            </div>
            <div className="spread"><button className="btn" onClick={() => setStep(1)}>חזרה</button><button className="btn primary" onClick={() => setStep(3)}>המשך</button></div>
          </>
        )}
        {step === 3 && vendor && (
          <>
            <div className="setting"><div><b>איסוף תוכן שיחות לניתוח מידע רגיש</b><div className="small muted">כבוי כברירת מחדל. התוכן נשמר מוצפן בנפרד, עם הרשאות צפייה מוגבלות ותקופת שמירה משלו.</div></div><Toggle on={content} onChange={setContent} label="איסוף תוכן" /></div>
            <div className="field">
              <label htmlFor="backfill">טעינת היסטוריה</label>
              <select id="backfill" value={backfill} onChange={(e) => setBackfill(e.target.value)}><option value="30">30 יום</option><option value="90">90 יום</option><option value="180">180 יום</option></select>
            </div>
            <div className="spread"><button className="btn" onClick={() => setStep(2)}>חזרה</button><button className="btn primary" onClick={() => { notify(`${vendor.name} חובר. טעינת ${backfill} ימים התחילה (הדגמה)`); onClose(); }}>חיבור והתחלת סנכרון</button></div>
          </>
        )}
      </div>
    </div>
  );
}

export function Connections() {
  const { notify } = useStore();
  const [wizard, setWizard] = useState(false);
  return (
    <div className="page">
      <PageHead title="חיבורים וכיסוי נתונים" sub="כל חיבור מציג מה הספק חושף, מה ההרשאות מאפשרות, ומה באמת זורם. נתון שלא זמין מסומן במפורש."
        action={<button className="btn primary" onClick={() => setWizard(true)}><Icon name="plus" size={15} />חיבור כלי חדש</button>} />
      <div className="grid g3">
        {connections.map((c) => {
          const [cls, label] = STATUS[c.status];
          return (
            <Panel key={c.productId}>
              <div className="conn">
                <div className="conn-head"><h3><ProductDot id={c.productId} /></h3><span className={`pill ${cls}`}>{label}</span></div>
                <dl className="kv">
                  <dt>הזדהות</dt><dd>{c.authMethod}</dd>
                  <dt>עדכון אחרון</dt><dd>לפני {c.freshness}</dd>
                  <dt>קצב הספק</dt><dd>{c.vendorLatency}</dd>
                  <dt>איסוף תוכן</dt><dd>{c.coverage.content === 0 ? "לא זמין אצל הספק" : c.contentEnabled ? "מופעל" : "כבוי"}</dd>
                </dl>
                <CoverageBars coverage={c.coverage} />
                {c.missing && <div className={c.status === "healthy" ? "notice info" : "notice"}>{c.missing}</div>}
                <div className="row">
                  <button className="btn" onClick={() => notify(`סנכרון ${productById[c.productId].name} התחיל (הדגמה)`)}><Icon name="refresh" size={14} />סנכרן עכשיו</button>
                  <button className="btn" onClick={() => setWizard(true)}>עדכון פרטי התחברות</button>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
      {wizard && <Wizard onClose={() => setWizard(false)} />}
    </div>
  );
}
