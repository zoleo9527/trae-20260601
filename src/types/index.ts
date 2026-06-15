export type OrderStatus =
  | 'pending'
  | 'scheduled'
  | 'assigned'
  | 'site_check_pending'
  | 'site_check_passed'
  | 'site_check_failed'
  | 'installation'
  | 'completed'
  | 'rejected'
  | 'pending_review'
  | 'delayed'
  | 'supplemented';

export type OrderStatusLabel = {
  [key in OrderStatus]: string;
};

export const ORDER_STATUS_LABELS: OrderStatusLabel = {
  pending: '待录入',
  scheduled: '已预约',
  assigned: '已派单',
  site_check_pending: '待现场确认',
  site_check_passed: '现场确认通过',
  site_check_failed: '现场确认不通过',
  installation: '安装中',
  completed: '已完成',
  rejected: '已驳回',
  pending_review: '待复核',
  delayed: '已延期',
  supplemented: '补录',
};

export type Role = 'dispatcher' | 'installer' | 'customer_service';

export type SiteCheckItem = {
  id: string;
  name: string;
  passed: boolean | null;
  remark: string;
};

export type SiteConditionRecord = {
  id: string;
  orderId: string;
  checkedBy: string;
  checkedAt: string;
  overallResult: 'passed' | 'failed' | 'pending';
  items: SiteCheckItem[];
  photos: string[];
  notes: string;
  orderVersion: number;
  appointmentVersion: number;
};

export type InstallationOrder = {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  productType: string;
  productModel: string;
  appointmentDate: string;
  appointmentTime: string;
  status: OrderStatus;
  assignee: string | null;
  assigneeName: string | null;
  dispatcher: string;
  dispatcherName: string;
  priority: 'normal' | 'urgent' | 'vip';
  version: number;
  appointmentVersion: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
  remarks: string;
  internalNotes: string;
  delayReason: string;
  rejectionReason: string;
  reviewNote: string;
  siteChecks: SiteConditionRecord[];
  changeLogs: ChangeLog[];
};

export type ChangeLog = {
  id: string;
  orderId: string;
  field: string;
  oldValue: string;
  newValue: string;
  operator: string;
  operatorName: string;
  operatorRole: Role;
  timestamp: string;
};

export type User = {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
};

export type FilterOptions = {
  status: OrderStatus | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
  assignee: string | 'all';
  priority: 'all' | 'normal' | 'urgent' | 'vip';
  keyword: string;
};

export const APPOINTMENT_FIELDS = [
  'appointmentDate',
  'appointmentTime',
  'address',
  'productType',
  'productModel',
  'customerName',
  'customerPhone',
] as const;
