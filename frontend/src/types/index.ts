export type Role = 'lobby_manager' | 'account_manager' | 'operation_manager';

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: Role;
}

export type CustomerStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type Urgency = 'normal' | 'urgent' | 'vip';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  business_type: string;
  urgency: Urgency;
  status: CustomerStatus;
  assigned_to: number;
  assigned_to_name?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  documents?: CustomerDocument[];
  due_diligence?: DueDiligence;
}

export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

export interface CustomerDocument {
  id: number;
  customer_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: DocumentStatus;
  notes: string;
  created_at: string;
}

export type DueDiligenceStatus = 'pending' | 'processing' | 'submitted' | 'completed' | 'rejected';

export interface DueDiligence {
  id: number;
  customer_id: number;
  customer_name?: string;
  source_customer_id: number;
  inherited_notes: string;
  processing_notes: string;
  status: DueDiligenceStatus;
  assigned_to: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  attachments?: DueDiligenceAttachment[];
}

export interface DueDiligenceAttachment {
  id: number;
  due_diligence_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  notes: string;
  created_at: string;
}

export interface Handoff {
  id: number;
  type: 'shift' | 'task';
  from_user: number;
  from_user_name?: string;
  to_user: number;
  to_user_name?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  confirmed_at?: string;
  tasks?: HandoffTask[];
}

export interface HandoffTask {
  id: number;
  handoff_id: number;
  task_type: 'customer' | 'due_diligence';
  task_id: number;
  task_description: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  lobby_manager: '大堂经理',
  account_manager: '客户经理',
  operation_manager: '运营主管'
};

export const STATUS_LABELS: Record<CustomerStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  rejected: '已驳回'
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  normal: '普通',
  urgent: '紧急',
  vip: 'VIP'
};

export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '待上传',
  uploaded: '已上传',
  approved: '已审核',
  rejected: '已驳回'
};

export const DUE_DILIGENCE_STATUS_LABELS: Record<DueDiligenceStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  submitted: '已提交',
  completed: '已完成',
  rejected: '已驳回'
};
