export enum LeaveStatus {
  DRAFT = 'DRAFT',
  PENDING_AFFAIRS = 'PENDING_AFFAIRS',
  PENDING_MATERIAL = 'PENDING_MATERIAL',
  URGENCY = 'URGENCY',
  RETURNED = 'RETURNED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum LeaveType {
  PERSONAL = 'PERSONAL',
  SICK = 'SICK',
  ANNUAL = 'ANNUAL',
  OTHER = 'OTHER',
}

export interface LeaveRequest {
  id: string;
  requestNo: string;
  teacherId: string;
  teacherName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachments: string[];
  lessonCount: number;
  status: LeaveStatus;
  currentHandlerRole: 'TEACHER' | 'AFFAIRS' | 'ADVISOR';
  currentHandlerId: string;
  currentHandlerName: string;
  blockReason: string | null;
  materialRequired: string[];
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approverId: string | null;
  approverName: string | null;
  idempotencyKey: string | null;
  urgencyCount: number;
}
