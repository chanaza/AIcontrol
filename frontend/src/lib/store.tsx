import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { findings as seed } from "../data/mock";
import type { Finding, FindingStatus } from "../data/types";

// Finding lifecycle changes stay in the viewer's browser for the prototype; the real system writes them to the API.
const KEY = "aicp.findingStatus.v1";
const load = (): Record<string, { status: FindingStatus; note?: string; at: string }> => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
};

interface Ctx {
  findings: Finding[];
  history: Record<string, { status: FindingStatus; note?: string; at: string }>;
  setStatus: (id: string, status: FindingStatus, note?: string) => void;
  toast: string | null;
  notify: (msg: string) => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState(load);
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2600); }, []);
  const setStatus = useCallback((id: string, status: FindingStatus, note?: string) => {
    setHistory((h) => {
      const next = { ...h, [id]: { status, note, at: new Date().toISOString() } };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);
  const findings = useMemo(() => seed.map((f) => (history[f.id] ? { ...f, status: history[f.id].status } : f)), [history]);
  return <StoreCtx.Provider value={{ findings, history, setStatus, toast, notify }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
};
