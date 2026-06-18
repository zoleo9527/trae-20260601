export type ScheduleStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'APPROVED' | 'PUBLISHED' | 'CHANGED' | 'REJECTED';

export type ParticipantType = 'STUDENT' | 'ADULT' | 'FAMILY';

export interface StatusTransition {
  id: string;
  fromStatus: ScheduleStatus;
  toStatus: ScheduleStatus;
  operator: string;
  operatorName: string;
  reason?: string;
  remarks?: string;
  createdAt: string;
}

export interface ScheduleChange {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
}

export interface Attachment {
  id: string;
  category: 'COURSEWARE' | 'LESSON_PLAN' | 'AUXILIARY' | 'PHOTO';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface ActivitySchedule {
  id: string;
  courseId: string;
  courseName: string;
  scheduledAt: string;
  location: string;
  expectedParticipants: number;
  participantType: ParticipantType;

  lecturerId: string;
  lecturerName: string;
  lecturerPhone: string;
  lecturerEmail: string;
  lecturerRequirements?: string;

  status: ScheduleStatus;
  statusHistory: StatusTransition[];

  changeHistory: ScheduleChange[];

  attachments: Attachment[];

  materialListId?: string;
  materialStatus?: MaterialStatus;

  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type MaterialStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'READY' | 'IN_USE' | 'RETURNED';

export type MaterialCategory = 'DEMO' | 'OPERATION' | 'DISPLAY';

export type MaterialItemStatus = 'PENDING' | 'PREPARED' | 'DAMAGED' | 'MISSING';

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  remarks?: string;
  status: MaterialItemStatus;
}

export interface ScheduleSnapshot {
  lecturerName: string;
  scheduledAt: string;
  location: string;
  expectedParticipants: number;
}

export interface MaterialList {
  id: string;
  scheduleId: string;
  scheduleSnapshot: ScheduleSnapshot;

  status: MaterialStatus;
  statusHistory: StatusTransition[];

  materials: MaterialItem[];
  preparedBy: string;
  preparedByName: string;
  startedAt?: string;
  preparedAt?: string;

  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;

  attachments: Attachment[];

  createdAt: string;
  updatedAt: string;
}
