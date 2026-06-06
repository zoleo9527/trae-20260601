export type UserRole = 'dorm_manager' | 'repair_worker' | 'logistics_supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'in_progress' 
  | 'completion_submitted' 
  | 'completion_confirmed' 
  | 'rework_requested' 
  | 'rework_in_progress' 
  | 'rework_completion_submitted'
  | 'rework_completion_confirmed'
  | 'closed';

export const statusLabels: Record<OrderStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '维修中',
  completion_submitted: '完工待确认',
  completion_confirmed: '已完工',
  rework_requested: '申请返修',
  rework_in_progress: '返修中',
  rework_completion_submitted: '返修完工待确认',
  rework_completion_confirmed: '返修已完工',
  closed: '已关闭'
};

export const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completion_submitted: 'bg-orange-100 text-orange-800',
  completion_confirmed: 'bg-green-100 text-green-800',
  rework_requested: 'bg-red-100 text-red-800',
  rework_in_progress: 'bg-orange-100 text-orange-800',
  rework_completion_submitted: 'bg-purple-100 text-purple-800',
  rework_completion_confirmed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-600'
};

export interface CompletionRecord {
  id: string;
  orderId: string;
  submittedBy: string;
  submittedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  confirmRemark?: string;
  description: string;
  materialsUsed?: string;
  laborHours?: number;
  photos?: string[];
  isRework: boolean;
  reworkCount: number;
  confirmed: boolean;
}

export interface ReworkRecord {
  id: string;
  orderId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  originalCompletionId: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'confirmed';
  completionId?: string;
}

export interface StatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedBy: string;
  changedAt: string;
  remark?: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  title: string;
  description: string;
  category: string;
  dormitory: string;
  roomNumber: string;
  reporter: string;
  reporterPhone?: string;
  createdAt: string;
  assignedTo?: string;
  status: OrderStatus;
  priority: 'low' | 'medium' | 'high';
  currentCompletionId?: string;
  completions: CompletionRecord[];
  reworks: ReworkRecord[];
  statusHistory: StatusHistory[];
  tags?: string[];
}

export interface AppState {
  orders: RepairOrder[];
  users: User[];
  currentUser: User | null;
  notifications: Notification[];
  initialized: boolean;
}

export interface NotificationDetail {
  completionId?: string;
  confirmedBy?: string;
  confirmRemark?: string;
  reworkReason?: string;
  originalCompletionDescription?: string;
}

export interface Notification {
  id: string;
  type: 'status_change' | 'rework' | 'completion' | 'assignment';
  orderId: string;
  orderNo: string;
  message: string;
  createdAt: string;
  read: boolean;
  relatedUserId?: string;
  detail?: NotificationDetail;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  orders: RepairOrder[];
  users: User[];
  notifications: Notification[];
}
