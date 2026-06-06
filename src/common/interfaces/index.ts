import { NotificationType, UserRole } from '../enums';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
}

export interface OperationLog {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  action: string;
  remark: string;
  timestamp: Date;
  previousState?: any;
  newState?: any;
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
