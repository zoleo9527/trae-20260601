export type UserRole = 'business' | 'director' | 'talent_agent' | 'finance';

export type CaseStatus =
  | 'pending_script'
  | 'scripting'
  | 'pending_approval'
  | 'shooting'
  | 'pending_data'
  | 'data_submitted'
  | 'data_rejected'
  | 'pending_settlement'
  | 'settlement_pending_review'
  | 'settlement_rejected'
  | 'completed'
  | 'delayed';

export const STATUS_LABELS: Record<CaseStatus, string> = {
  pending_script: '待脚本撰写',
  scripting: '脚本撰写中',
  pending_approval: '脚本待审批',
  shooting: '拍摄执行中',
  pending_data: '待提交结案数据',
  data_submitted: '结案数据已提交',
  data_rejected: '结案数据被驳回',
  pending_settlement: '待费用结算',
  settlement_pending_review: '结算待复核',
  settlement_rejected: '结算被驳回',
  completed: '已完成',
  delayed: '已延期'
};

export const ROLE_LABELS: Record<UserRole, string> = {
  business: '商务',
  director: '编导',
  talent_agent: '达人经纪',
  finance: '财务'
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  pending_script: '#94a3b8',
  scripting: '#3b82f6',
  pending_approval: '#f59e0b',
  shooting: '#8b5cf6',
  pending_data: '#f97316',
  data_submitted: '#10b981',
  data_rejected: '#ef4444',
  pending_settlement: '#06b6d4',
  settlement_pending_review: '#ec4899',
  settlement_rejected: '#dc2626',
  completed: '#22c55e',
  delayed: '#eab308'
};

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface SettlementData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clickRate: number;
  conversionRate: number;
  actualFee: number;
  platformFee: number;
  talentFee: number;
}

export interface CaseRecord {
  id: string;
  demandId: string;
  talentId: string;
  scriptId: string;
  status: CaseStatus;
  currentHandler: UserRole | null;
  settlementData?: SettlementData;
  dataSubmittedAt?: string;
  dataSubmittedBy?: string;
  rejectReason?: string;
  rejectAt?: string;
  rejectBy?: string;
  supplementaryRemark?: string;
  supplementaryAt?: string;
  settlementReviewedAt?: string;
  settlementReviewedBy?: string;
  settlementRemark?: string;
  paidAt?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
  delayedDays?: number;
  brandName?: string;
  productName?: string;
  talentName?: string;
}

export interface TodoItem {
  id: string;
  caseId: string;
  title: string;
  description: string;
  role: UserRole;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}

export interface CaseDetailResponse {
  case: CaseRecord;
  demand: any;
  talent: any;
  script: any;
  statusLogs: StatusLog[];
  relatedUsers: { business?: User; agent?: User };
}

export interface StatusLog {
  id: string;
  caseId: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  operatorId: string;
  operatorRole: UserRole;
  remark?: string;
  createdAt: string;
  fromStatusLabel?: string;
  toStatusLabel?: string;
  operatorRoleLabel?: string;
}
