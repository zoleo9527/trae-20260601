export enum ExamTrackStatus {
  DRAFT = 'draft',
  SUBMITTED_BY_TEACHER = 'submitted_by_teacher',
  REVIEWING_BY_ADMIN = 'reviewing_by_admin',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPPLEMENTED = 'supplemented',
  IN_PRACTICE = 'in_practice',
  COMPLETED = 'completed',
  EXAM_PASSED = 'exam_passed',
  EXAM_FAILED = 'exam_failed'
}

export enum OperationType {
  CREATE = 'create',
  SUBMIT = 'submit',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  UPDATE_PLAN = 'update_plan',
  UPDATE_PROGRESS = 'update_progress',
  COMPLETE = 'complete',
  CONFIRM_EXAM_RESULT = 'confirm_exam_result'
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  CONSULTANT = 'consultant'
}

export interface DailyGoal {
  dayOfWeek: number;
  durationMinutes: number;
  focusPoints: string[];
  tempoRange: string;
}

export interface PracticePlan {
  id: string;
  recordId: string;
  dailyGoals: DailyGoal[];
  weeklyFocus: string;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  progress: number;
}

export interface ExamTrackRecord {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  examLevel: string;
  trackName: string;
  trackType: 'required' | 'optional';
  practicePlan: PracticePlan;
  status: ExamTrackStatus;
  rejectReason?: string;
  supplementNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface OperationLog {
  id: string;
  recordId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operationType: OperationType;
  previousStatus?: ExamTrackStatus;
  newStatus: ExamTrackStatus;
  comment?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateRecordRequest {
  studentId: string;
  studentName: string;
  instrument: string;
  examLevel: string;
  trackName: string;
  trackType: 'required' | 'optional';
  practicePlan: PracticePlan;
}

export interface UpdateRecordRequest {
  studentName?: string;
  instrument?: string;
  examLevel?: string;
  trackName?: string;
  trackType?: 'required' | 'optional';
  practicePlan?: PracticePlan;
}

export interface RejectRequest {
  reason: string;
}

export interface SupplementRequest {
  supplementNotes: string;
  practicePlan?: PracticePlan;
}

export interface ConfirmExamRequest {
  passed: boolean;
}

export interface UpdateProgressRequest {
  progress: number;
}
