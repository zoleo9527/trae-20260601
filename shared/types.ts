export type UserRole = 'reception' | 'coach' | 'manager';

export type ComplaintStatus =
  | 'draft'
  | 'pending_review'
  | 'review_rejected'
  | 'pending_compensation'
  | 'compensation_rejected'
  | 'completed'
  | 'closed';

export type ComplaintType =
  | 'venue'
  | 'equipment'
  | 'service'
  | 'booking'
  | 'billing'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ActionType =
  | 'create'
  | 'submit'
  | 'review_approve'
  | 'review_reject'
  | 'resubmit'
  | 'compensation_propose'
  | 'compensation_approve'
  | 'compensation_reject'
  | 'complete'
  | 'note';

export type CompensationType =
  | 'refund'
  | 'discount'
  | 'free_service'
  | 'gift'
  | 'other';

export type CompensationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed';

export interface ActionLog {
  id: string;
  complaintId: string;
  actionType: ActionType;
  operatorRole: UserRole;
  operatorName: string;
  timestamp: string;
  remark?: string;
  rejectReason?: string;
  supplementaryNote?: string;
}

export interface Compensation {
  id: string;
  complaintId: string;
  type: CompensationType;
  amount?: number;
  description: string;
  status: CompensationStatus;
  proposedBy: string;
  proposedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
}

export interface Complaint {
  id: string;
  complaintNo: string;
  customerName: string;
  customerPhone: string;
  type: ComplaintType;
  source: 'phone' | 'onsite' | 'wechat' | 'other';
  priority: Priority;
  title: string;
  description: string;
  relatedCoach?: string;
  status: ComplaintStatus;
  currentHandlerRole: UserRole;
  currentHandlerName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  actionLogs: ActionLog[];
  compensations: Compensation[];
}

export interface CreateComplaintRequest {
  customerName: string;
  customerPhone: string;
  type: ComplaintType;
  source: 'phone' | 'onsite' | 'wechat' | 'other';
  priority: Priority;
  title: string;
  description: string;
  relatedCoach?: string;
  createdBy: string;
}

export interface ActionRequest {
  actionType: ActionType;
  operatorRole: UserRole;
  operatorName: string;
  remark?: string;
  rejectReason?: string;
  supplementaryNote?: string;
}

export interface CreateCompensationRequest {
  type: CompensationType;
  amount?: number;
  description: string;
  proposedBy: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  reception: '场馆前台',
  coach: '教练',
  manager: '值班店长',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  draft: '草稿',
  pending_review: '待初审',
  review_rejected: '初审驳回',
  pending_compensation: '待补偿审批',
  compensation_rejected: '补偿驳回',
  completed: '已完成',
  closed: '已关闭',
};

export const TYPE_LABELS: Record<ComplaintType, string> = {
  venue: '场地问题',
  equipment: '设备问题',
  service: '服务态度',
  booking: '预约问题',
  billing: '收费问题',
  other: '其他',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  create: '创建投诉',
  submit: '提交初审',
  review_approve: '初审通过',
  review_reject: '初审驳回',
  resubmit: '补录重提',
  compensation_propose: '提出补偿方案',
  compensation_approve: '补偿审批通过',
  compensation_reject: '补偿审批驳回',
  complete: '处理完成',
  note: '添加备注',
};

export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  refund: '退款',
  discount: '折扣',
  free_service: '免费服务',
  gift: '赠送礼品',
  other: '其他',
};

export const SOURCE_LABELS = {
  phone: '电话',
  onsite: '现场',
  wechat: '微信',
  other: '其他',
};
