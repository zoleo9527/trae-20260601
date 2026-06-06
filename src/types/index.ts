export type UserRole = 'business' | 'director' | 'talent_agent';

export interface Talent {
  id: string;
  name: string;
  avatar: string;
  platform: string;
  followers: number;
  category: string;
  phone: string;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
}

export interface ScriptVersion {
  id: string;
  projectId: string;
  version: string;
  content: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  remark?: string;
}

export interface Project {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  talentId: string;
  talentName: string;
  scriptId: string;
  scriptVersion: string;
  status: 'pending' | 'shooting' | 'editing' | 'delivering' | 'completed';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShootingSchedule {
  id: string;
  projectId: string;
  projectName: string;
  brandName: string;
  talentName: string;
  shootDate: string;
  shootTime: string;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  equipment: string[];
  notes?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDelivery {
  id: string;
  projectId: string;
  projectName: string;
  brandName: string;
  talentName: string;
  type: 'video' | 'image' | 'copy';
  version: string;
  fileUrl: string;
  fileName: string;
  size: number;
  status: 'pending' | 'submitted' | 'reviewing' | 'approved' | 'revision_requested' | 'rejected';
  submitter: string;
  submittedAt?: string;
  reviewer?: string;
  reviewedAt?: string;
  feedback?: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: 'status_change' | 'comment' | 'file_upload' | 'schedule_update' | 'delivery_update';
  title: string;
  description: string;
  operator: string;
  operatorRole: UserRole;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  type: 'shooting' | 'delivery' | 'review' | 'meeting';
  relatedId: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'completed';
  assignee: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: 'critical' | 'warning' | 'info';
  relatedId: string;
  relatedType: 'project' | 'schedule' | 'delivery';
  createdAt: string;
}

export interface RecentChange {
  id: string;
  title: string;
  description: string;
  type: 'status' | 'schedule' | 'delivery' | 'script';
  relatedId: string;
  operator: string;
  createdAt: string;
}
