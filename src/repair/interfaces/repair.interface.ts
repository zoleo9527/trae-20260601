export type RepairStatus = 'pending' | 'dispatched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type RepairCategory = 'electrical' | 'plumbing' | 'carpentry' | 'appliance' | 'other';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface RepairOrder {
  id: string;
  orderNo: string;
  title: string;
  description: string;
  category: RepairCategory;
  urgency: UrgencyLevel;
  location: string;
  dormitory?: string;
  reporterName: string;
  reporterPhone: string;
  reporterId: string;
  status: RepairStatus;
  hasUnclearResponsibility: boolean;
  responsibilityNote?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
