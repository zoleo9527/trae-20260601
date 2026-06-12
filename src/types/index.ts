export type UserRole = 'project_manager' | 'review_secretary' | 'finance' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export type ProjectStatus = 
  | 'draft' 
  | 'notice_pending' 
  | 'notice_rejected' 
  | 'notice_approved' 
  | 'refund_pending' 
  | 'refund_rejected' 
  | 'refund_approved' 
  | 'paid' 
  | 'completed';

export type NoticeStatus = 'pending' | 'approved' | 'rejected';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Notice {
  id: string;
  project_id: string;
  status: NoticeStatus;
  reject_reason?: string;
  file_url?: string;
  processed_by?: string;
  submitted_at?: string;
  processed_at?: string;
}

export interface Refund {
  id: string;
  project_id: string;
  status: RefundStatus;
  reject_reason?: string;
  receipt_url?: string;
  amount?: number;
  processed_by?: string;
  applied_at?: string;
  processed_at?: string;
  paid_at?: string;
}

export interface Activity {
  id: string;
  project_id: string;
  action: string;
  description: string;
  performed_by: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  deposit_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  notice?: Notice;
  refund?: Refund;
  activities?: Activity[];
  created_by_user?: User;
}

export interface ProjectCreateData {
  name: string;
  code: string;
  deposit_amount: number;
}

export interface ProjectUpdateData {
  name?: string;
  code?: string;
  deposit_amount?: number;
  status?: ProjectStatus;
}

export interface NoticeData {
  file_url?: string;
}

export interface RefundData {
  amount: number;
  receipt_url?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  project_id: string;
  project_name: string;
  type: 'notice' | 'refund';
  assignee: string;
  due_date?: string;
  priority: 'high' | 'medium' | 'low';
}
