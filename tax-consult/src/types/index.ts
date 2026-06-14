export type ConsultationStatus =
  | 'pending'
  | 'accepted'
  | 'processing'
  | 'returned'
  | 'supplementary'
  | 'reviewing'
  | 'completed';

export type DocumentStatus =
  | 'not_submitted'
  | 'submitted'
  | 'returned'
  | 'confirmed';

export type ResponsibleRole = 'consultant' | 'project_manager' | 'client_finance';

export interface StatusChange {
  id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
  remark: string;
}

export interface ConsultationRecord {
  id: string;
  case_number: string;
  client_name: string;
  client_contact: string;
  consultant_id: string;
  project_manager_id: string;
  client_finance_id: string;
  consultation_type: string;
  description: string;
  status: ConsultationStatus;
  status_history: StatusChange[];
  created_at: string;
  updated_at: string;
  remark: string;
}

export interface DocumentChecklistItem {
  id: string;
  consultation_id: string;
  document_name: string;
  document_type: string;
  status: DocumentStatus;
  responsible_role: ResponsibleRole;
  responsible_id: string;
  due_date: string;
  submitted_at: string | null;
  status_history: StatusChange[];
  remark: string;
}

export interface Staff {
  id: string;
  name: string;
  role: ResponsibleRole;
  department: string;
  phone: string;
}

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending: '待受理',
  accepted: '已受理',
  processing: '处理中',
  returned: '已退回',
  supplementary: '补录中',
  reviewing: '复核中',
  completed: '已完成',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  not_submitted: '未提交',
  submitted: '已提交',
  returned: '已退回',
  confirmed: '已确认',
};

export const ROLE_LABELS: Record<ResponsibleRole, string> = {
  consultant: '税务顾问',
  project_manager: '项目经理',
  client_finance: '客户财务',
};

export const CONSULTATION_STATUS_COLORS: Record<ConsultationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  accepted: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  returned: 'bg-red-100 text-red-700',
  supplementary: 'bg-orange-100 text-orange-700',
  reviewing: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  not_submitted: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  returned: 'bg-red-100 text-red-700',
  confirmed: 'bg-green-100 text-green-700',
};

export const MAIN_FLOW_STATUSES: ConsultationStatus[] = [
  'pending',
  'accepted',
  'processing',
  'returned',
  'supplementary',
  'reviewing',
  'completed',
];

export type ConsultationFilter = {
  status: ConsultationStatus | 'all';
  consultant_id: string;
  project_manager_id: string;
  client_finance_id: string;
  search: string;
  date_from: string;
  date_to: string;
};

export type DocumentFilter = {
  status: DocumentStatus | 'all';
  responsible_role: ResponsibleRole | 'all';
  consultation_id: string;
  search: string;
};
