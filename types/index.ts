export type AppealType = 'price_regret' | 'hidden_defect' | 'payment_account_error';

export type AppealStatus = 
  | 'pending_receipt'
  | 'pending_inspection'
  | 'pending_finance'
  | 'pending_confirmation'
  | 'resolved'
  | 'rejected'
  | 'returned';

export type UserRole = 'receiver' | 'inspector' | 'finance' | 'admin';

export type EvidenceType = 'photo' | 'video' | 'document' | 'chat_log' | 'system_snapshot';

export type AuditAction = 'create' | 'status_change' | 'evidence_upload' | 'reject' | 'return' | 'resolve' | 'reassign' | 'forward';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export interface Evidence {
  id: string;
  appealId: string;
  type: EvidenceType;
  title: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size?: number;
  description?: string;
}

export interface AuditLog {
  id: string;
  appealId: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  details: AuditLogDetails;
  previousStatus?: AppealStatus;
  newStatus?: AppealStatus;
}

export interface AuditLogDetails {
  actionLabel?: string;
  comment?: string;
  resolutionAmount?: number;
  reason?: string;
  evidenceId?: string;
  evidenceType?: string;
  evidenceTitle?: string;
  orderId?: string;
  customerName?: string;
  previousAssignee?: string;
  newAssignee?: string;
  newAssigneeName?: string;
  [key: string]: unknown;
}

export interface Appeal {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productModel: string;
  appealType: AppealType;
  status: AppealStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  estimatedAmount?: number;
  actualAmount?: number;
  claimedAmount?: number;
  resolutionAmount?: number;
  deadline?: string;
  evidenceIds: string[];
  auditLogIds: string[];
  rejectionReason?: string;
  returnReason?: string;
}

export interface AppealSummary {
  todayPending: number;
  overdueCount: number;
  returnedCount: number;
  totalAppeals: number;
  resolvedCount: number;
}

export interface ErrorCode {
  APPEAL_NOT_FOUND: string;
  EVIDENCE_UPLOAD_FAILED: string;
  INVALID_STATUS_TRANSITION: string;
  ROLE_PERMISSION_DENIED: string;
  DEADLINE_EXCEEDED: string;
  INTERNAL_ERROR: string;
  METHOD_NOT_ALLOWED: string;
}

export const ERROR_CODES: ErrorCode = {
  APPEAL_NOT_FOUND: 'APPEAL_001',
  EVIDENCE_UPLOAD_FAILED: 'EVIDENCE_001',
  INVALID_STATUS_TRANSITION: 'STATUS_001',
  ROLE_PERMISSION_DENIED: 'PERMISSION_001',
  DEADLINE_EXCEEDED: 'TIMEOUT_001',
  INTERNAL_ERROR: 'INTERNAL_001',
  METHOD_NOT_ALLOWED: 'METHOD_001',
};

export const APPEAL_TYPE_MAP: Record<AppealType, string> = {
  price_regret: '估价反悔',
  hidden_defect: '暗病争议',
  payment_account_error: '打款账号错误',
};

export const APPEAL_STATUS_MAP: Record<AppealStatus, string> = {
  pending_receipt: '待收货确认',
  pending_inspection: '待检测复核',
  pending_finance: '待财务处理',
  pending_confirmation: '待用户确认',
  resolved: '已解决',
  rejected: '已驳回',
  returned: '已退回',
};

export const USER_ROLE_MAP: Record<UserRole, string> = {
  receiver: '收货员',
  inspector: '检测师',
  finance: '财务',
  admin: '管理员',
};

export const EVIDENCE_TYPE_MAP: Record<EvidenceType, string> = {
  photo: '照片',
  video: '视频',
  document: '文档',
  chat_log: '聊天记录',
  system_snapshot: '系统快照',
};

export const AUDIT_ACTION_MAP: Record<AuditAction, string> = {
  create: '创建申诉',
  status_change: '状态变更',
  evidence_upload: '上传证据',
  reject: '驳回申诉',
  return: '退回补充',
  resolve: '确认解决',
  reassign: '重新分配',
  forward: '转交下一环节',
};

export const STATUS_TRANSITIONS: Record<AppealStatus, AppealStatus[]> = {
  pending_receipt: ['pending_inspection', 'returned'],
  pending_inspection: ['pending_finance', 'pending_receipt', 'rejected'],
  pending_finance: ['pending_confirmation', 'pending_inspection', 'rejected'],
  pending_confirmation: ['resolved', 'pending_finance', 'returned'],
  resolved: [],
  rejected: [],
  returned: ['pending_receipt'],
};

export const ROLE_ALLOWED_STATUS: Record<UserRole, AppealStatus[]> = {
  receiver: ['pending_receipt'],
  inspector: ['pending_inspection'],
  finance: ['pending_finance', 'pending_confirmation'],
  admin: ['pending_receipt', 'pending_inspection', 'pending_finance', 'pending_confirmation'],
};

export const SLA_DAYS: Record<AppealType, number> = {
  price_regret: 3,
  hidden_defect: 5,
  payment_account_error: 2,
};

export const STATUS_ASSIGNEE_MAP: Record<AppealStatus, string | undefined> = {
  pending_receipt: 'u1',
  pending_inspection: 'u2',
  pending_finance: 'u3',
  pending_confirmation: 'u3',
  resolved: undefined,
  rejected: undefined,
  returned: undefined,
};