import {
  daily, departments, findings, isoDay, licenses, people, personById, personUsage, postureChecks, productById, products,
} from "../data/mock";
import type { CostType, Finding } from "../data/types";

const MONTH_START = isoDay(27); // 1 Sept (TODAY is 28 Sept)
const DAYS_IN_MONTH = 30;
const ELAPSED = 28;

export function productMonth(productId: string) {
  const p = productById[productId];
  const mtd = daily.filter((d) => d.productId === productId && d.date >= MONTH_START).reduce((s, d) => s + d.cost, 0);
  const forecast = p.billing === "seat" ? p.seats! * p.seatPrice! : (mtd / ELAPSED) * DAYS_IN_MONTH;
  const prevStart = isoDay(57), prevEnd = isoDay(28);
  const prev = daily.filter((d) => d.productId === productId && d.date >= prevStart && d.date <= prevEnd).reduce((s, d) => s + d.cost, 0);
  const costType: CostType = p.billing === "seat" ? "license" : "actual";
  return { mtd, forecast, prev, costType };
}

export function windowSum(productId: string | null, field: "sessions" | "tokens" | "cost", from: number, to: number) {
  return daily
    .filter((d) => (productId ? d.productId === productId : true) && d.date >= isoDay(from) && d.date <= isoDay(to))
    .reduce((s, d) => s + d[field], 0);
}

export function productSummary(productId: string) {
  const p = productById[productId];
  const lic = licenses.filter((l) => l.productId === productId);
  const active = lic.filter((l) => l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30).length;
  const sessions30 = windowSum(productId, "sessions", 29, 0);
  const sessionsPrev = windowSum(productId, "sessions", 59, 30);
  const tokens30 = windowSum(productId, "tokens", 29, 0);
  const users30 = p.billing === "seat" ? active : Math.max(...daily.filter((d) => d.productId === productId).slice(-30).map((d) => d.activeUsers));
  const m = productMonth(productId);
  const openFindings = findings.filter((f) => f.productIds.includes(productId) && (f.status === "open" || f.status === "in_progress"));
  return { p, seats: p.seats ?? 0, assigned: lic.length, active, users30, utilization: p.seats ? active / p.seats : null, sessions30, sessionsTrend: sessionsPrev ? sessions30 / sessionsPrev - 1 : 0, tokens30, ...m, openFindings };
}

export function orgTotals() {
  const perProduct = products.map((p) => ({ id: p.id, ...productMonth(p.id) }));
  const mtd = perProduct.reduce((s, x) => s + x.mtd, 0);
  const forecast = perProduct.reduce((s, x) => s + x.forecast, 0);
  const prev = perProduct.reduce((s, x) => s + x.prev, 0);
  const licenseCost = perProduct.filter((x) => x.costType === "license").reduce((s, x) => s + x.forecast, 0);
  const usageCost = forecast - licenseCost;
  const activePeople = new Set(licenses.filter((l) => l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30).map((l) => l.personId));
  personUsage.filter((u) => u.costType === "actual").forEach((u) => activePeople.add(u.personId));
  const licensedPeople = new Set(licenses.map((l) => l.personId));
  const sessions30 = windowSum(null, "sessions", 29, 0);
  const sessionsPrev = windowSum(null, "sessions", 59, 30);
  const tokens30 = windowSum(null, "tokens", 29, 0);
  const tokensPrev = windowSum(null, "tokens", 59, 30);
  const budget = departments.reduce((s, d) => s + d.monthlyBudget, 0);
  return { mtd, forecast, prev, licenseCost, usageCost, activeUsers: activePeople.size, licensedPeople: licensedPeople.size, headcount: people.length, sessions30, sessionsPrev, tokens30, tokensPrev, budget, perProduct };
}

export const isOpen = (f: Finding) => f.status === "open" || f.status === "in_progress";

export function findingStats(list: Finding[] = findings) {
  const open = list.filter(isOpen);
  const bySev = { critical: 0, high: 0, medium: 0, low: 0 } as Record<Finding["severity"], number>;
  open.forEach((f) => bySev[f.severity]++);
  const savings = open.filter((f) => f.category === "cost" || f.category === "usage").reduce((s, f) => s + (f.impact.usdMonthly ?? 0), 0);
  return { open: open.length, bySev, savings };
}

export function postureScore(productId?: string) {
  let pass = 0, fail = 0, unknown = 0;
  for (const c of postureChecks) {
    for (const [pid, r] of Object.entries(c.results)) {
      if (productId && pid !== productId) continue;
      if (r === "pass") pass++; else if (r === "fail") fail++; else if (r === "unknown") unknown++;
    }
  }
  return { pass, fail, unknown, score: pass / Math.max(1, pass + fail + unknown) };
}

export function deptSummary(deptId: string) {
  const ppl = people.filter((p) => p.deptId === deptId);
  const ids = new Set(ppl.map((p) => p.id));
  const usage = personUsage.filter((u) => ids.has(u.personId));
  const byProduct = products.map((p) => ({ id: p.id, cost: usage.filter((u) => u.productId === p.id).reduce((s, u) => s + u.cost30, 0) })).filter((x) => x.cost > 0);
  const forecast = usage.reduce((s, u) => s + u.cost30, 0);
  const licensed = new Set(licenses.filter((l) => ids.has(l.personId)).map((l) => l.personId));
  const active = new Set(licenses.filter((l) => ids.has(l.personId) && l.lastActiveDaysAgo !== null && l.lastActiveDaysAgo <= 30).map((l) => l.personId));
  const idleSeats = licenses.filter((l) => ids.has(l.personId) && (l.lastActiveDaysAgo === null || l.lastActiveDaysAgo > 30));
  const idleCost = idleSeats.reduce((s, l) => s + (productById[l.productId].seatPrice ?? 0), 0);
  const estimated = usage.filter((u) => u.costType === "estimated").reduce((s, u) => s + u.cost30, 0);
  return { headcount: ppl.length, licensed: licensed.size, active: active.size, forecast, byProduct, idleSeats: idleSeats.length, idleCost, estimated };
}

export function personFootprint(personId: string) {
  const usage = personUsage.filter((u) => u.personId === personId);
  const lic = licenses.filter((l) => l.personId === personId);
  const f = findings.filter((x) => x.personIds.includes(personId));
  return { person: personById[personId], usage, lic, findings: f, cost: usage.reduce((s, u) => s + u.cost30, 0), sessions: usage.reduce((s, u) => s + u.sessions30, 0), tokens: usage.reduce((s, u) => s + u.tokens30, 0) };
}

export function seriesByProduct(field: "cost" | "sessions" | "activeUsers" | "tokens", daysBack = 90, productIds = products.map((p) => p.id)) {
  const dates: string[] = [];
  for (let d = daysBack - 1; d >= 0; d--) dates.push(isoDay(d));
  const series = productIds.map((pid) => {
    const map = new Map(daily.filter((x) => x.productId === pid).map((x) => [x.date, x[field]]));
    return { id: pid, label: productById[pid].name, color: productById[pid].color, values: dates.map((d) => map.get(d) ?? 0) };
  });
  return { dates, series };
}
