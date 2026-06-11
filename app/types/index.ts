export type Role = "supervisor" | "property" | "engineer";

export const ROLE_LABELS: Record<Role, string> = {
  supervisor: "维保主管",
  property: "物业联系人",
  engineer: "巡检工程师",
};

export const ROLE_ICONS: Record<Role, string> = {
  supervisor: "👔",
  property: "🏢",
  engineer: "🔧",
};

export const ROLE_DEFAULT_NAMES: Record<Role, string> = {
  supervisor: "赵建国",
  property: "孙经理",
  engineer: "钱卫东",
};

export const ROLE_COLORS: Record<Role, string> = {
  supervisor: "bg-brand-50 text-brand-700",
  property: "bg-sky-50 text-sky-700",
  engineer: "bg-moss-50 text-moss-700",
};

export type RenewalStatus =
  | "expiring_soon"
  | "hesitating"
  | "open_risks"
  | "renewed"
  | "new";

export const RENEWAL_STATUS: Record<RenewalStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  expiring_soon: {
    label: "即将到期",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "⏰",
  },
  hesitating: {
    label: "客户犹豫",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "🤔",
  },
  open_risks: {
    label: "未闭环隐患",
    color: "text-brand-700",
    bg: "bg-brand-50",
    border: "border-brand-200",
    icon: "⚠️",
  },
  renewed: {
    label: "已续约",
    color: "text-moss-700",
    bg: "bg-moss-50",
    border: "border-moss-200",
    icon: "✅",
  },
  new: {
    label: "新建",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: "📋",
  },
};

export type RiskLevel = "critical" | "high" | "medium" | "low";

export const RISK_LEVELS: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  critical: { label: "严重", color: "text-rose-700", bg: "bg-rose-100" },
  high: { label: "高", color: "text-brand-700", bg: "bg-brand-100" },
  medium: { label: "中", color: "text-amber-700", bg: "bg-amber-100" },
  low: { label: "低", color: "text-slate-600", bg: "bg-slate-100" },
};

export type InspectionRating = "excellent" | "good" | "fair" | "poor";

export const INSPECTION_RATINGS: Record<InspectionRating, { label: string; score: number; color: string; bg: string }> = {
  excellent: { label: "优秀", score: 5, color: "text-moss-600", bg: "bg-moss-50" },
  good: { label: "良好", score: 4, color: "text-sky-600", bg: "bg-sky-50" },
  fair: { label: "一般", score: 3, color: "text-amber-600", bg: "bg-amber-50" },
  poor: { label: "较差", score: 2, color: "text-rose-600", bg: "bg-rose-50" },
};

export type DangerStatus = "open" | "in_progress" | "closed";

export const DANGER_STATUS: Record<DangerStatus, { label: string; color: string; bg: string }> = {
  open: { label: "待整改", color: "text-brand-700", bg: "bg-brand-50" },
  in_progress: { label: "整改中", color: "text-amber-700", bg: "bg-amber-50" },
  closed: { label: "已闭环", color: "text-moss-700", bg: "bg-moss-50" },
};

export interface Contract {
  id: string;
  contractNo: string;
  projectName: string;
  propertyCompany: string;
  propertyContact: string;
  propertyPhone: string;
  buildingType: string;
  buildingArea: number;
  fireSystemTypes: string[];
  contractAmount: number;
  serviceFrequency: string;
  startDate: string;
  endDate: string;
  signedAt: string;
  supervisorName: string;
  engineerPhone: string;
}

export interface HiddenDanger {
  id: string;
  contractId: string;
  title: string;
  description: string;
  location: string;
  riskLevel: RiskLevel;
  foundAt: string;
  foundBy: string;
  foundByRole: Role;
  deadline: string;
  status: DangerStatus;
  rectificationPlan: string;
  closedAt?: string;
  closedBy?: string;
}

export interface InspectionReport {
  id: string;
  contractId: string;
  reportNo: string;
  inspectionDate: string;
  inspectorName: string;
  inspectorRole: Role;
  systemChecked: string[];
  itemsChecked: number;
  itemsPassed: number;
  itemsFailed: number;
  rating: InspectionRating;
  summary: string;
  customerFeedback?: string;
  customerRating?: InspectionRating;
  attachments?: string[];
}

export interface FollowUpNote {
  id: string;
  contractId: string;
  content: string;
  author: string;
  authorRole: Role;
  createdAt: string;
  isInternal: boolean;
}

export interface RenewalRecord {
  id: string;
  contractId: string;
  status: RenewalStatus;
  nextContactAt: string;
  assignedTo: string;
  assignedRole: Role;
  renewalOffer?: number;
  discountApplied?: number;
  signedContractNo?: string;
  renewedAt?: string;
  notes?: string;
}

export interface MaintenanceContract {
  contract: Contract;
  renewal: RenewalRecord;
  latestInspection?: InspectionReport;
  hiddenDangers: HiddenDanger[];
  followUps: FollowUpNote[];
  inspections: InspectionReport[];
}

export function findRoleByName(name: string, contract: MaintenanceContract): Role {
  if (contract.contract.supervisorName === name) return "supervisor";
  if (contract.contract.propertyContact === name) return "property";
  for (const fu of contract.followUps) {
    if (fu.author === name) return fu.authorRole;
  }
  for (const hd of contract.hiddenDangers) {
    if (hd.foundBy === name) return hd.foundByRole;
    if (hd.closedBy === name) return "supervisor";
  }
  for (const insp of contract.inspections) {
    if (insp.inspectorName === name) return insp.inspectorRole;
  }
  return "supervisor";
}

export function resolvePersonName(contract: MaintenanceContract, role: Role): string {
  const nameSet = new Set<string>();
  for (const fu of contract.followUps) {
    if (fu.authorRole === role) nameSet.add(fu.author);
  }
  for (const hd of contract.hiddenDangers) {
    if (hd.foundByRole === role) nameSet.add(hd.foundBy);
  }
  for (const insp of contract.inspections) {
    if (insp.inspectorRole === role) nameSet.add(insp.inspectorName);
  }
  if (role === "supervisor") nameSet.add(contract.contract.supervisorName);
  if (role === "property") nameSet.add(contract.contract.propertyContact);
  if (nameSet.size > 0) return Array.from(nameSet)[nameSet.size - 1];
  return ROLE_DEFAULT_NAMES[role];
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatMoney(amount: number): string {
  return "¥" + amount.toLocaleString("zh-CN");
}

export function formatDate(d: string): string {
  return d.replace(/-/g, "/");
}

export function filterFollowUpsByRole(
  followUps: FollowUpNote[],
  currentRole: Role
): FollowUpNote[] {
  if (currentRole !== "property") return followUps;
  return followUps.filter((fu) => !fu.isInternal);
}

export function getLatestVisibleNote(
  followUps: FollowUpNote[],
  currentRole: Role
): FollowUpNote | null {
  const visible = filterFollowUpsByRole(followUps, currentRole);
  if (visible.length === 0) return null;
  return visible[visible.length - 1];
}

export function canEditRenewal(role: Role): boolean {
  return role === "supervisor";
}

export function canEditDanger(role: Role): boolean {
  return role === "supervisor" || role === "engineer";
}

export function canMarkInternal(role: Role): boolean {
  return role !== "property";
}
