export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const usdK = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : usd(n));
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const compact = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`;
export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
export const signedPct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(0)}%`;
export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const dateTime = (iso: string) => `${shortDate(iso)} ${iso.slice(11, 16)}`;
export const daysAgo = (n: number | null) => (n === null ? "מעולם לא" : n === 0 ? "היום" : n === 1 ? "אתמול" : `לפני ${n} ימים`);
export const minutesAgo = (m: number) =>
  m < 1 ? "עכשיו" : m < 60 ? `לפני ${m} דק׳` : m < 1440 ? `לפני ${Math.round(m / 60)} שע׳` : `לפני ${Math.round(m / 1440)} ימים`;
