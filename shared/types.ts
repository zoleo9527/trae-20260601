export type UserRole = 'enroller' | 'coach' | 'safety_officer';

export type ReminderStatus =
  | 'pending_schedule'
  | 'pending_execute'
  | 'pending_confirm'
  | 'completed'
  | 'disputed';

export type PaymentStatus = 'unpaid' | 'paid' | 'pending';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone: string;
}

export interface Student {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  registrationDate: string;
  remainingHours: number;
  motorcycleType: 'E' | 'D' | 'F';
}

export interface FeeDetail {
  baseFee: number;
  extraHoursFee: number;
  materialFee?: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface HistoryRecord {
  id: string;
  reminderId: string;
  status: ReminderStatus;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  action: string;
  remark: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  studentId: string;
  student: Student;
  subject: string;
  reason: string;
  originalHours: number;
  makeupHours: number;
  status: ReminderStatus;
  currentOwnerId: string;
  currentOwnerName: string;
  currentOwnerRole: UserRole;
  scheduledAt?: string;
  assignedCoachId?: string;
  assignedCoachName?: string;
  executedAt?: string;
  executedRemark?: string;
  fee: FeeDetail;
  createdAt: string;
  createdBy: string;
  history: HistoryRecord[];
}

export interface ScheduleReminderRequest {
  scheduledAt: string;
  assignedCoachId: string;
  remark: string;
}

export interface ExecuteReminderRequest {
  executedAt: string;
  executedRemark: string;
}

export interface ConfirmFeeRequest {
  paymentStatus: PaymentStatus;
  confirmedBy: string;
  remark: string;
}

export interface ReviewRequest {
  remark: string;
  approve: boolean;
}

export interface DisputeRequest {
  remark: string;
  operatorId: string;
}
