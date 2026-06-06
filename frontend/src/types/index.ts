export type UserRole = 'scheduling_manager' | 'ticket_supervisor' | 'duty_manager';

export type GroupTicketStatus =
  | 'pending_scheduling'
  | 'scheduling_reviewing'
  | 'scheduling_approved'
  | 'scheduling_rejected'
  | 'pending_verification'
  | 'verifying'
  | 'verification_pending_review'
  | 'verification_rejected'
  | 'completed'
  | 'cancelled';

export interface VerificationData {
  actualAttendance: number;
  ticketUsed: number;
  ticketRefunded: number;
  remark?: string;
}

export interface RejectRecord {
  reason: string;
  rejectedBy: string;
  rejectedAt: string;
  role: UserRole;
}

export interface GroupTicket {
  id: string;
  orderNo: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  movieName: string;
  showDate: string;
  showTime: string;
  hallName: string;
  ticketCount: number;
  unitPrice: number;
  totalAmount: number;

  status: GroupTicketStatus;
  currentHandler: UserRole;

  verificationData?: VerificationData;
  verifiedAt?: string;
  verifiedBy?: string;

  rejectRecords: RejectRecord[];
  supplementaryRemark?: string;
  supplementaryAt?: string;

  reviewedAt?: string;
  reviewedBy?: string;
  reviewRemark?: string;

  slaDeadline?: string;
  stuckReason?: string;
  nextNodeTime?: string;

  createdAt: string;
  updatedAt: string;

  statusLabel?: string;
  statusColor?: string;
  currentHandlerLabel?: string;
  hasReject?: boolean;
  hasSupplementary?: boolean;
  isOverdue?: boolean;
  isUrgent?: boolean;
}

export interface TodoItem {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  role: UserRole;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  slaDeadline?: string;
  createdAt: string;
  ticket?: GroupTicket;
  isOverdue?: boolean;
  isUrgent?: boolean;
}

export interface StatusLog {
  id: string;
  ticketId: string;
  fromStatus: GroupTicketStatus | null;
  toStatus: GroupTicketStatus;
  operatorId: string;
  operatorRole: UserRole;
  operatorName: string;
  remark?: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  scheduling_manager: '排片经理',
  ticket_supervisor: '票务主管',
  duty_manager: '值班经理',
};

export const STATUS_LABELS: Record<GroupTicketStatus, string> = {
  pending_scheduling: '待排片审核',
  scheduling_reviewing: '排片审核中',
  scheduling_approved: '排片已通过',
  scheduling_rejected: '排片已驳回',
  pending_verification: '待核销',
  verifying: '核销处理中',
  verification_pending_review: '核销待复核',
  verification_rejected: '核销已驳回',
  completed: '已完成',
  cancelled: '已取消',
};

export const STATUS_COLORS: Record<GroupTicketStatus, string> = {
  pending_scheduling: '#faad14',
  scheduling_reviewing: '#1890ff',
  scheduling_approved: '#52c41a',
  scheduling_rejected: '#ff4d4f',
  pending_verification: '#faad14',
  verifying: '#1890ff',
  verification_pending_review: '#faad14',
  verification_rejected: '#ff4d4f',
  completed: '#52c41a',
  cancelled: '#8c8c8c',
};
