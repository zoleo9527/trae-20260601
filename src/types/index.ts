export type Role = 'dorm_manager' | 'repairman' | 'admin';

export type Status = 'pending' | 'processing' | 'completed' | 'overdue' | 'rejected';

export type Priority = 'low' | 'medium' | 'high';

export interface Operation {
  id: string;
  operator: string;
  operatorRole: Role;
  action: string;
  timestamp: string;
}

export interface Satisfaction {
  score: number;
  comment: string;
  createdAt: string;
  operator: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  location: string;
  description: string;
  status: Status;
  priority: Priority;
  submitter: string;
  submitterRole: Role;
  assignee?: string;
  assigneeRole?: Role;
  createdAt: string;
  updatedAt: string;
  dueTime: string;
  responsibilityUnclear: boolean;
  history: Operation[];
  satisfaction?: Satisfaction;
}

export type FilterType = 'today' | 'overdue' | 'rejected' | 'all';
