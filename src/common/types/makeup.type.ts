export enum MakeupStatus {
  PENDING_TEACHER_CONFIRM = 'PENDING_TEACHER_CONFIRM',
  PENDING_PARENT_CONFIRM = 'PENDING_PARENT_CONFIRM',
  PENDING_SCHEDULE = 'PENDING_SCHEDULE',
  PENDING_EXECUTE = 'PENDING_EXECUTE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  BLOCKED = 'BLOCKED',
}

export interface MakeupCoordination {
  id: string;
  coordinationNo: string;
  leaveId: string;
  leaveRequestNo: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  studentNames: string[];
  originalLessonDates: string[];
  proposedMakeupDates: string[];
  proposedMakeupTeacherId: string | null;
  proposedMakeupTeacherName: string | null;
  status: MakeupStatus;
  currentHandlerRole: 'TEACHER' | 'AFFAIRS' | 'ADVISOR';
  currentHandlerId: string;
  currentHandlerName: string;
  blockReason: string | null;
  coordinationLogs: CoordinationLog[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  idempotencyKey: string | null;
}

export interface CoordinationLog {
  id: string;
  timestamp: string;
  actorRole: string;
  actorId: string;
  actorName: string;
  action: string;
  comment: string;
}
