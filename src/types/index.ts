export type OrderStatus =
  | 'PENDING'
  | 'SCAN_UPLOADED'
  | 'PROCESSING'
  | 'ASSIGNED'
  | 'IN_PRODUCTION'
  | 'PENDING_INSPECTION'
  | 'COMPLETED'
  | 'REWORK';

export type Role = 'CUSTOMER_SERVICE' | 'DESIGNER' | 'QUALITY' | 'ADMIN';

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED';

export type ScanFileStatus = 'UPLOADED' | 'PROCESSED';

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  toothType: string;
  shade: string;
  deliveryDate: string;
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  reworkCount: number;
}

export interface ScanFile {
  id: string;
  orderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: ScanFileStatus;
  customerServiceRemark: string;
}

export interface Assignment {
  id: string;
  scanFileId: string;
  orderId: string;
  technicianId: string;
  technicianName: string;
  customerServiceRemark: string;
  designerRemark: string;
  combinedRemark: string;
  assignedAt: string;
  assignedBy: string;
  status: AssignmentStatus;
  completedAt?: string;
  estimatedDays: number;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: 'AVAILABLE' | 'BUSY';
  avatar?: string;
}

export interface Remark {
  id: string;
  orderId: string;
  content: string;
  createdBy: string;
  role: Role;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  orderId: string;
  action: string;
  oldStatus?: OrderStatus;
  newStatus?: OrderStatus;
  operator: string;
  role: Role;
  createdAt: string;
  detail: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface FilterParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '待上传扫描',
  SCAN_UPLOADED: '扫描已上传',
  PROCESSING: '设计处理中',
  ASSIGNED: '已派单',
  IN_PRODUCTION: '生产中',
  PENDING_INSPECTION: '待质检',
  COMPLETED: '已完成',
  REWORK: '返工中',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-warning-100 text-warning-700 border-warning-300',
  SCAN_UPLOADED: 'bg-primary-100 text-primary-700 border-primary-300',
  PROCESSING: 'bg-warning-100 text-warning-600 border-warning-300',
  ASSIGNED: 'bg-primary-100 text-primary-600 border-primary-300',
  IN_PRODUCTION: 'bg-warning-100 text-warning-600 border-warning-300',
  PENDING_INSPECTION: 'bg-warning-100 text-warning-700 border-warning-300',
  COMPLETED: 'bg-success-100 text-success-700 border-success-300',
  REWORK: 'bg-danger-100 text-danger-700 border-danger-300',
};

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER_SERVICE: '接单客服',
  DESIGNER: '数字设计师',
  QUALITY: '质检员',
  ADMIN: '管理员',
};

export const ROLE_COLORS: Record<Role, string> = {
  CUSTOMER_SERVICE: 'bg-blue-100 text-blue-700',
  DESIGNER: 'bg-purple-100 text-purple-700',
  QUALITY: 'bg-green-100 text-green-700',
  ADMIN: 'bg-gray-100 text-gray-700',
};

export const TOOTH_TYPES = [
  '烤瓷冠',
  '全瓷冠',
  '贴面',
  '嵌体',
  '活动义齿',
  '种植牙',
  '正畸矫治器',
  '临时冠',
];

export const SHADE_OPTIONS = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
];

export const STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['SCAN_UPLOADED'],
  SCAN_UPLOADED: ['PROCESSING'],
  PROCESSING: ['ASSIGNED'],
  ASSIGNED: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['PENDING_INSPECTION'],
  PENDING_INSPECTION: ['COMPLETED', 'REWORK'],
  COMPLETED: [],
  REWORK: ['PROCESSING'],
};

export const canTransitionTo = (current: OrderStatus, next: OrderStatus): boolean => {
  return STATE_TRANSITIONS[current]?.includes(next) ?? false;
};
