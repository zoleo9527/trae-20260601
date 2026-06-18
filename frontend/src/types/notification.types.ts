export type NotificationType =
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_CHANGED'
  | 'SCHEDULE_APPROVED'
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_REJECTED'
  | 'MATERIAL_READY'
  | 'MATERIAL_BLOCKED'
  | 'MATERIAL_CHANGE_REQUIRED'
  | 'ACTIVITY_REMINDER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface NotificationAction {
  type: string;
  label: string;
  params?: any;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;

  recipients: string[];
  roles?: string[];

  relatedScheduleId?: string;
  relatedMaterialId?: string;

  priority: Priority;

  actions: NotificationAction[];

  readBy: string[];

  createdAt: string;
  expiresAt?: string;
}
