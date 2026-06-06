export type UserRole = 'scheduling_manager' | 'ticket_supervisor' | 'duty_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

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

  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  role: UserRole;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
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

export interface FilterParams {
  status?: GroupTicketStatus;
  handler?: UserRole;
  hasReject?: boolean;
  hasSupplementary?: boolean;
  keyword?: string;
}
