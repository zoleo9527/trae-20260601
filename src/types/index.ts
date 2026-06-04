export type SurgeryStatus =
  | 'scheduled'
  | 'applying'
  | 'lens_pending'
  | 'lens_confirmed'
  | 'in_progress'
  | 'verifying'
  | 'completed'
  | 'exception';

export type UserRole = 'nurse' | 'doctor' | 'followup' | 'admin';

export type ExceptionLevel = 'low' | 'medium' | 'high' | 'critical';

export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export type ExceptionType = 'lens_mismatch' | 'material_shortage' | 'verification_rejected' | 'other';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface LensReservation {
  id: string;
  surgeryId: string;
  lensModel: string;
  lensPower: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedBy?: string;
  confirmedAt?: string;
  rejectedReason?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'used' | 'returned' | 'shortage';
}

export interface MaterialConsumption {
  id: string;
  surgeryId: string;
  items: MaterialItem[];
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  status: 'draft' | 'submitted' | 'verified' | 'rejected';
  rejectedReason?: string;
}

export interface StatusHistory {
  id: string;
  surgeryId: string;
  status: SurgeryStatus;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  remark?: string;
}

export interface ExceptionRecord {
  id: string;
  surgeryId: string;
  type: ExceptionType;
  level: ExceptionLevel;
  status: ExceptionStatus;
  title: string;
  description: string;
  createdAt: string;
  handlerId?: string;
  handlerName?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface Surgery {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  surgeryType: string;
  eye: 'left' | 'right' | 'both';
  scheduledTime: string;
  room: string;
  status: SurgeryStatus;
  nurseId: string;
  nurseName: string;
  doctorId: string;
  doctorName: string;
  followupId?: string;
  followupName?: string;
  lensReservation?: LensReservation;
  materialConsumption?: MaterialConsumption;
  statusHistory: StatusHistory[];
  exceptions: ExceptionRecord[];
}

export interface DashboardStats {
  totalSurgeries: number;
  pendingLens: number;
  pendingVerification: number;
  activeExceptions: number;
  completedToday: number;
  statusBreakdown: Record<SurgeryStatus, number>;
}

export interface TodoItem {
  id: string;
  title: string;
  count: number;
  role: UserRole;
  color: string;
}
