export type UserRole = 'RECEPTION' | 'TECHNICIAN' | 'MANAGER';

export type OrderStatus =
  | 'PENDING_SELECTION'
  | 'IN_SELECTION'
  | 'PENDING_QUOTE'
  | 'QUOTE_REJECTED'
  | 'QUOTE_CONFIRMED';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface TireSpec {
  id: string;
  brand: string;
  size: string;
  loadIndex: string;
  speedRating: string;
  unitPrice: number;
  quantity: number;
}

export interface Quote {
  subtotal: number;
  laborFee: number;
  discount: number;
  total: number;
}

export interface StatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  remark: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  vehiclePlate: string;
  vehicleModel: string;
  phone: string;
  status: OrderStatus;
  tireSpecs: TireSpec[];
  quote: Quote | null;
  selectionResponsible: string | null;
  selectionResponsibleName: string | null;
  quoteResponsible: string | null;
  quoteResponsibleName: string | null;
  rejectReason: string | null;
  basisMaterials: string[];
  remark: string;
  createdAt: string;
  updatedAt: string;
  isException?: boolean;
  exceptionReason?: string;
}

export interface DashboardData {
  pendingCount: number;
  exceptionCount: number;
  completedCount: number;
  pendingList: Order[];
  exceptionList: Order[];
  completedList: Order[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_SELECTION: ['IN_SELECTION'],
  IN_SELECTION: ['PENDING_QUOTE'],
  PENDING_QUOTE: ['QUOTE_CONFIRMED', 'QUOTE_REJECTED'],
  QUOTE_REJECTED: ['IN_SELECTION', 'PENDING_QUOTE'],
  QUOTE_CONFIRMED: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_SELECTION: '待选型',
  IN_SELECTION: '选型中',
  PENDING_QUOTE: '待报价',
  QUOTE_REJECTED: '报价驳回',
  QUOTE_CONFIRMED: '已确认',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  RECEPTION: '前台',
  TECHNICIAN: '技师',
  MANAGER: '店长',
};

export const ERROR_CODES = {
  SUCCESS: 0,
  ORDER_NOT_FOUND: 40001,
  INVALID_TRANSITION: 40002,
  PERMISSION_DENIED: 40003,
  INVALID_PARAMS: 40004,
  INVALID_AMOUNT: 40005,
  REJECT_REASON_EMPTY: 40006,
  INTERNAL_ERROR: 50001,
} as const;

export const ERROR_MESSAGES: Record<number, string> = {
  [ERROR_CODES.SUCCESS]: '操作成功',
  [ERROR_CODES.ORDER_NOT_FOUND]: '工单不存在',
  [ERROR_CODES.INVALID_TRANSITION]: '状态流转非法',
  [ERROR_CODES.PERMISSION_DENIED]: '无操作权限',
  [ERROR_CODES.INVALID_PARAMS]: '参数缺失或格式错误',
  [ERROR_CODES.INVALID_AMOUNT]: '报价金额异常',
  [ERROR_CODES.REJECT_REASON_EMPTY]: '驳回原因不能为空',
  [ERROR_CODES.INTERNAL_ERROR]: '服务端内部错误',
};
