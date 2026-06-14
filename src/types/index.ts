export type UserRole = 'admin' | 'teaching' | 'consultant';

export interface Renewal {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  packageName: string;
  expireDate: string;
  status: 'pending' | 'processing' | 'completed' | 'risk';
  responsibleRole: UserRole;
  responsibleName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalHistory {
  id: string;
  renewalId: string;
  action: string;
  operator: string;
  operatorRole: string;
  description: string;
  createdAt: string;
}

export interface Communication {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  status: 'pending' | 'ongoing' | 'completed';
  priority: 'high' | 'medium' | 'low';
  responsibleRole: UserRole;
  responsibleName: string;
  lastContactAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationHistory {
  id: string;
  communicationId: string;
  type: 'call' | 'message' | 'meeting';
  content: string;
  operator: string;
  operatorRole: string;
  createdAt: string;
}

export interface RenewalFilter {
  status?: 'pending' | 'processing' | 'completed' | 'risk';
  startDate?: string;
  endDate?: string;
  studentName?: string;
}

export interface CommunicationFilter {
  status?: 'pending' | 'ongoing' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  studentName?: string;
}
