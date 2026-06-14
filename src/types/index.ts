export type ClaimStatus =
  | 'pending'
  | 'urged'
  | 'returned'
  | 'supplement'
  | 'approved'
  | 'calculating'
  | 'completed';

export type ActionType =
  | 'create'
  | 'approve'
  | 'reject'
  | 'supplement'
  | 'material_ok'
  | 'start_calc'
  | 'finish_calc'
  | 'urge';

export type Role = 'specialist' | 'surveyor' | 'supervisor';

export interface Handler {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface WorkflowLog {
  id: string;
  claimId: string;
  actionType: ActionType;
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus;
  handlerId: string;
  handlerRole: Role;
  reason: string;
  createdAt: string;
  durationHours: number;
}

export interface UrgeRecord {
  id: string;
  claimId: string;
  operatorId: string;
  targetHandlerId: string;
  message: string;
  createdAt: string;
}

export interface SupplementMaterial {
  id: string;
  claimId: string;
  name: string;
  description: string;
  requesterId: string;
  providerId: string;
  status: 'pending' | 'provided';
  requestedAt: string;
  providedAt?: string;
}

export interface CalcItem {
  name: string;
  amount: number;
  formula: string;
  remark: string;
}

export interface CompensationCalc {
  id: string;
  claimId: string;
  handlerId: string;
  items: CalcItem[];
  totalAmount: number;
  formula: string;
  remark: string;
  calculatedAt: string;
}

export interface Claim {
  id: string;
  caseNumber: string;
  policyNumber: string;
  claimantName: string;
  accidentType: string;
  accidentDescription: string;
  claimAmount: number;
  status: ClaimStatus;
  currentHandlerId: string;
  currentHandlerRole: Role;
  createdAt: string;
  updatedAt: string;
  stuckReason: string;
  urgeCount: number;
  workflowLogs: WorkflowLog[];
  urgeRecords: UrgeRecord[];
  supplementMaterials: SupplementMaterial[];
  compensationCalc?: CompensationCalc;
}

export interface ResponsibilityInfo {
  currentHandler: Handler | null;
  stuckPoint: string;
  reason: string;
}

export interface BackupRecord {
  id: string;
  name: string;
  createdAt: string;
  size: number;
  itemCount: number;
  filePath?: string;
}

export interface AppSettings {
  autoBackup: boolean;
  autoBackupDays: number;
  theme: 'light' | 'dark';
  currentUserId: string;
}

export interface AppData {
  claims: Claim[];
  handlers: Handler[];
  settings: AppSettings;
  backups: BackupRecord[];
  version: string;
  checksum: string;
}

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  pending: '待处理',
  urged: '催办中',
  returned: '退回待改',
  supplement: '补材料中',
  approved: '审批通过',
  calculating: '赔付计算中',
  completed: '已完成',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  create: '创建案件',
  approve: '审批通过',
  reject: '退回案件',
  supplement: '要求补材料',
  material_ok: '材料已补齐',
  start_calc: '开始赔付计算',
  finish_calc: '完成赔付计算',
  urge: '发起催办',
};

export const ROLE_LABELS: Record<Role, string> = {
  specialist: '理赔专员',
  surveyor: '查勘员',
  supervisor: '核赔主管',
};

export const STATUS_COLORS: Record<ClaimStatus, string> = {
  pending: 'bg-slate-400',
  urged: 'bg-red-500',
  returned: 'bg-amber-500',
  supplement: 'bg-blue-500',
  approved: 'bg-emerald-500',
  calculating: 'bg-purple-500',
  completed: 'bg-green-600',
};

export const STATUS_TEXT_COLORS: Record<ClaimStatus, string> = {
  pending: 'text-slate-400',
  urged: 'text-red-500',
  returned: 'text-amber-500',
  supplement: 'text-blue-500',
  approved: 'text-emerald-500',
  calculating: 'text-purple-500',
  completed: 'text-green-600',
};

export const STATUS_BORDER_COLORS: Record<ClaimStatus, string> = {
  pending: 'border-slate-400',
  urged: 'border-red-500',
  returned: 'border-amber-500',
  supplement: 'border-blue-500',
  approved: 'border-emerald-500',
  calculating: 'border-purple-500',
  completed: 'border-green-600',
};
