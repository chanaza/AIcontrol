import { useMemo, useState, type ReactNode } from "react";
import { ORG_NAME, people, products } from "../data/mock";
import { href } from "../lib/router";
import { useStore } from "../lib/store";
import { Icon } from "./icons";

const NAV: { group: string; items: { id: string; label: string; icon: string }[] }[] = [
  { group: "", items: [{ id: "overview", label: "סקירה", icon: "overview" }, { id: "findings", label: "ממצאים והמלצות", icon: "findings" }, { id: "live", label: "זרם בזמן אמת", icon: "live" }] },
  { group: "ניתוח", items: [{ id: "costs", label: "עלויות ואופטימיזציה", icon: "costs" }, { id: "security", label: "אבטחה ומדיניות", icon: "security" }, { id: "usage", label: "שימוש ואימוץ", icon: "usage" }] },
  { group: "ישויות", items: [{ id: "products", label: "כלי AI", icon: "products" }, { id: "users", label: "משתמשים", icon: "users" }, { id: "departments", label: "מחלקות ומרכזי עלות", icon: "departments" }] },
  { group: "ניהול", items: [{ id: "connections", label: "חיבורים וכיסוי נתונים", icon: "connections" }, { id: "settings", label: "הגדרות ומדיניות", icon: "settings" }] },
];

export function Layout({ route, children }: { route: string; children: ReactNode }) {
  const { findings, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const critical = findings.filter((f) => f.severity === "critical" && (f.status === "open" || f.status === "in_progress")).length;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const r: { href: string; label: string; kind: string }[] = [];
    findings.filter((f) => f.title.toLowerCase().includes(s) || f.id.toLowerCase().includes(s)).slice(0, 5).forEach((f) => r.push({ href: href("findings", f.id), label: f.title, kind: f.id }));
    products.filter((p) => p.name.toLowerCase().includes(s)).forEach((p) => r.push({ href: href("products", p.id), label: p.name, kind: "כלי" }));
    people.filter((p) => p.name.includes(q.trim()) || p.email.includes(s)).slice(0, 6).forEach((p) => r.push({ href: href("users", p.id), label: p.name, kind: p.email }));
    return r;
  }, [q, findings]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
  };

  return (
    <div className="shell">
      <aside className={`side ${open ? "open" : ""}`} aria-label="ניווט ראשי">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div><b>Control Plane</b><span>{ORG_NAME}</span></div>
        </div>
        {NAV.map((g) => (
          <nav className="nav-group" key={g.group || "main"}>
            {g.group && <span className="label">{g.group}</span>}
            {g.items.map((it) => (
              <a key={it.id} className={`nav-item ${route === it.id ? "active" : ""}`} href={href(it.id)} onClick={() => setOpen(false)}>
                <Icon name={it.icon} />{it.label}
                {it.id === "findings" && critical > 0 && <span className="nav-count">{critical}</span>}
              </a>
            ))}
          </nav>
        ))}
        <div className="side-foot">
          <span>7 כלים מחוברים · {people.length} עובדים</span>
          <span>ניתוח בלבד. אין שינוי בכלי ה-AI.</span>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="תפריט"><Icon name="menu" /></button>
          <div className="search">
            <Icon name="search" size={15} />
            <input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש משתמש, כלי או ממצא" aria-label="חיפוש" onBlur={() => window.setTimeout(() => setQ(""), 200)} />
            {results.length > 0 && (
              <div className="search-results">
                {results.map((r) => <a key={r.href} href={r.href}><span>{r.label}</span><span className="muted small">{r.kind}</span></a>)}
              </div>
            )}
          </div>
          <span style={{ flex: 1 }} />
          <span className="live-dot"><i /><span>קליטה רציפה · עודכן לפני 3 דק׳</span></span>
          <span className="demo-flag">נתוני הדגמה</span>
          <button className="icon-btn" onClick={toggleTheme} aria-label="החלפת ערכת צבעים"><Icon name="theme" /></button>
        </header>
        {children}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
