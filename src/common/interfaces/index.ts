import { NotificationType, TimelineBusinessType, UserRole } from '../enums';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  classId?: string;
  className?: string;
}

export interface OperationTimeline {
  id: string;
  businessType: TimelineBusinessType;
  businessId: string;
  action: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operateTime: Date;
  detail?: Record<string, any>;
}

export interface IdempotentRequest {
  requestId: string;
  resourceType: string;
  resourceId?: string;
  createdAt: Date;
  processedAt?: Date;
  result?: any;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  recipientRole: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  classId: string;
  className: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
}
