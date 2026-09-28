// Shapes mirror the planned normalized model (docs/IMPLEMENTATION_PLAN.md §6) so the
// mock layer can later be replaced by API calls without touching the pages.

export type Category = "chat" | "code" | "api";
export type Billing = "seat" | "usage";
export type CostType = "actual" | "estimated" | "license";
export type Severity = "critical" | "high" | "medium" | "low";
export type FindingCategory = "cost" | "security" | "usage" | "data";
export type FindingStatus = "open" | "in_progress" | "resolved" | "accepted" | "dismissed";
export type CheckState = "pass" | "fail" | "unknown" | "na";
export type Capability = "users" | "usage" | "cost" | "sessions" | "audit" | "content";

export interface Product {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  billing: Billing;
  seatPrice?: number;
  seats?: number;
  approved: "approved" | "review" | "unapproved";
  color: string;
  consoleUrl: string;
}

export interface Department {
  id: string;
  name: string;
  costCenter: string;
  headcount: number;
  monthlyBudget: number;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  deptId: string;
  team: string;
  role: string;
  status: "active" | "offboarded";
  offboardedAt?: string;
}

export interface License {
  personId: string;
  productId: string;
  assignedAt: string;
  lastActiveDaysAgo: number | null;
}

export interface DailyPoint {
  date: string;
  productId: string;
  activeUsers: number;
  sessions: number;
  tokens: number;
  cost: number;
  costType: CostType;
}

export interface PersonUsage {
  personId: string;
  productId: string;
  sessions30: number;
  tokens30: number;
  cost30: number;
  costType: CostType;
}

export interface EvidenceTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleName: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  summary: string;
  productIds: string[];
  deptIds: string[];
  personIds: string[];
  detectedAt: string;
  status: FindingStatus;
  realtime?: boolean;
  owner: { name: string; role: string };
  impact: { usdMonthly?: number; risk?: string; users?: number };
  confidence: number;
  coverageNote: string;
  evidence: EvidenceTable;
  remediation: { steps: string[]; consoleUrl: string; consoleLabel: string };
  message: string;
  verification: string;
}

export interface PostureCheck {
  id: string;
  name: string;
  description: string;
  results: Record<string, CheckState>;
}

export interface AuditEvent {
  id: string;
  at: string;
  productId: string;
  actor: string;
  action: string;
  target: string;
  anomalous: boolean;
  reason?: string;
}

export interface ApiKey {
  id: string;
  productId: string;
  name: string;
  ownerId: string | null;
  createdDaysAgo: number;
  lastUsedDaysAgo: number;
  cost30: number;
  scope: string;
}

export interface ContentDetection {
  id: string;
  at: string;
  productId: string;
  personId: string;
  sessionId: string;
  entity: string;
  count: number;
  snippet: string;
  policy?: string;
}

export interface Connection {
  productId: string;
  status: "healthy" | "degraded" | "error" | "not_connected";
  authMethod: string;
  lastSyncMinutesAgo: number;
  freshness: string;
  vendorLatency: string;
  coverage: Record<Capability, number>;
  contentEnabled: boolean;
  missing?: string;
}

export interface LiveEvent {
  id: string;
  minutesAgo: number;
  productId: string;
  severity: Severity;
  text: string;
  findingId?: string;
}
