export type UserRole = 'leasing_manager' | 'ops_supervisor' | 'store_manager';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Rectification {
  id: number;
  store_id: number;
  store_name: string;
  brand: string;
  inspector_id: number | null;
  inspector_name: string | null;
  inspection_date: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  requirement: string;
  deadline: string;
  status: RectificationStatus;
  handler_id: number | null;
  handler_name: string | null;
  rectify_note: string | null;
  rectify_date: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  logs?: OperationLog[];
  comments?: Comment[];
  review?: Review | null;
}

export type RectificationStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed';

export interface Review {
  id: number;
  rectification_id: number;
  store_id: number;
  store_name: string;
  brand: string;
  reviewer_id: number | null;
  reviewer_name: string | null;
  review_date: string | null;
  result: string | null;
  review_note: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  rectification?: Rectification | null;
  rectAttachments?: Attachment[];
  attachments?: Attachment[];
  logs?: OperationLog[];
  rectLogs?: OperationLog[];
  comments?: Comment[];
}

export type ReviewStatus = 'pending' | 'completed';

export interface Attachment {
  id: number;
  ref_type: string;
  ref_id: number;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploader_name: string | null;
  uploaded_at: string;
}

export interface OperationLog {
  id: number;
  ref_type: string;
  ref_id: number;
  operator_name: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  ref_type: string;
  ref_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  brand: string;
  floor: string | null;
  area: number | null;
  manager: string | null;
  phone: string | null;
}

export interface StatsData {
  pendingRectCount: number;
  pendingReviewCount: number;
  riskCount: number;
  myTaskCount: number;
  recentLogs: OperationLog[];
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待整改',
  in_progress: '整改中',
  pending_review: '待复查',
  completed: '已完成',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  in_progress: 'primary',
  pending_review: 'primary',
  completed: 'success',
};

export const SEVERITY_LABELS: Record<string, string> = {
 一般: '一般',
 严重: '严重',
 紧急: '紧急',
};

export const SEVERITY_COLORS: Record<string, string> = {
 一般: 'default',
 严重: 'warning',
 紧急: 'error',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  leasing_manager: '招商经理',
  ops_supervisor: '营运督导',
  store_manager: '品牌店长',
};

export const CATEGORY_OPTIONS = ['卫生', '陈列', '安全', '人员', '其他'];
export const SEVERITY_OPTIONS = ['一般', '严重', '紧急'];
