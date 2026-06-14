export type Role = 'registrar' | 'fieldCoach' | 'safetyOfficer';

export type RegistrationStatus =
  | 'pending'
  | 'completed'
  | 'rejected'
  | 'supplement'
  | 'delayed';

export type PhysicalStatus =
  | 'pending'
  | 'passed'
  | 'failed'
  | 'review'
  | 'recheck';

export type ResponsibilityMark =
  | 'none'
  | 'registrar_issue'
  | 'coach_issue'
  | 'borderline';

export interface RegistrationDoc {
  id: string;
  name: string;
  submitted: boolean;
  note?: string;
}

export interface Registration {
  id: string;
  studentName: string;
  idCard: string;
  phone: string;
  address: string;
  status: RegistrationStatus;
  docs: RegistrationDoc[];
  registrarName: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  rejectReason?: string;
  supplementNote?: string;
  delayHours?: number;
}

export interface PhysicalCheck {
  id: string;
  registrationId: string;
  studentName: string;
  status: PhysicalStatus;
  eyesightLeft: number | null;
  eyesightRight: number | null;
  hearing: 'normal' | 'abnormal' | null;
  bloodPressure: string | null;
  heartRate: number | null;
  height: number | null;
  limbsCheck: 'normal' | 'abnormal' | null;
  medicalHistory: string;
  examiner: string;
  examinerRole: Role;
  checkedAt: string | null;
  reviewNote?: string;
  recheckNote?: string;
  responsibilityMark: ResponsibilityMark;
  responsibilityNote?: string;
}

export interface ExceptionRecord {
  id: string;
  registrationId: string;
  studentName: string;
  type: 'registration' | 'physical' | 'handover';
  level: 'warning' | 'error' | 'info';
  content: string;
  handler: string;
  handlerRole: Role;
  resolved: boolean;
  resolvedAt?: string;
  resolveNote?: string;
  createdAt: string;
}

export interface HandoverLog {
  id: string;
  fromRole: Role;
  toRole: Role;
  fromUser: string;
  toUser: string;
  summary: string;
  pendingItems: number;
  exceptionItems: number;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  registrationByStatus: Record<RegistrationStatus, number>;
  totalPhysicals: number;
  physicalByStatus: Record<PhysicalStatus, number>;
  pendingHandover: number;
  exceptions: number;
  todayCompleted: number;
}

export interface TrainingSchedule {
  id: string;
  date: string;
  timeSlot: string;
  coach: string;
  venue: string;
  capacity: number;
  registered: number;
}

export interface ExamBatch {
  id: string;
  date: string;
  subject: 'subject1' | 'subject2' | 'subject3' | 'subject4';
  venue: string;
  capacity: number;
  registered: number;
}

export interface PhysicalForm {
  id: string;
  studentName: string;
  issuedBy: string;
  issuedDate: string;
  validUntil: string;
  formNumber: string;
}
