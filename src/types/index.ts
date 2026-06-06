export enum UserRole {
  SCHEDULE_MANAGER = 'schedule_manager',
  TICKET_SUPERVISOR = 'ticket_supervisor',
  DUTY_MANAGER = 'duty_manager'
}

export enum ScreeningExceptionType {
  TEMP_HALL_CHANGE = 'temp_hall_change',
  EQUIPMENT_FAILURE = 'equipment_failure',
  GROUP_TICKET_CONFUSION = 'group_ticket_confusion',
  CONTENT_ABNORMAL = 'content_abnormal'
}

export enum ScreeningExceptionStatus {
  REPORTED = 'reported',
  PROCESSING = 'processing',
  HALL_CHANGED = 'hall_changed',
  REFUND_INITIATED = 'refund_initiated',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

export enum RefundReason {
  SCREENING_EXCEPTION = 'screening_exception',
  USER_REQUEST = 'user_request',
  GROUP_TICKET_ISSUE = 'group_ticket_issue'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Hall {
  id: string;
  name: string;
  capacity: number;
  status: 'normal' | 'maintenance' | 'disabled';
  equipmentStatus: string;
}

export interface Schedule {
  id: string;
  movieName: string;
  hallId: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  soldSeats: number;
  status: 'scheduled' | 'playing' | 'finished' | 'cancelled';
}

export interface ScreeningException {
  id: string;
  scheduleId: string;
  type: ScreeningExceptionType;
  status: ScreeningExceptionStatus;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  currentHallId?: string;
  targetHallId?: string;
  affectedTicketCount: number;
  handledBy?: string;
  handledAt?: string;
  resolution?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  scheduleId: string;
  exceptionId?: string;
  userId: string;
  userName: string;
  phone: string;
  ticketCount: number;
  totalAmount: number;
  reason: RefundReason;
  status: RefundStatus;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  processedAt?: string;
  remark?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ScreeningExceptionFilter extends PaginationParams {
  status?: ScreeningExceptionStatus;
  type?: ScreeningExceptionType;
  scheduleId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RefundFilter extends PaginationParams {
  status?: RefundStatus;
  reason?: RefundReason;
  scheduleId?: string;
  exceptionId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}
