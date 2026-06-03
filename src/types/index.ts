export type OrderStatus = 
  | 'pending' 
  | 'model_received' 
  | 'color_confirmed' 
  | 'in_production' 
  | 'quality_check' 
  | 'rework' 
  | 'completed';

export type UserRoleType = 'customer_service' | 'designer' | 'inspector';

export interface User {
  id: string;
  name: string;
  role: UserRoleType;
  avatar: string;
}

export interface Order {
  id: string;
  orderNo: string;
  patientName: string;
  clinic: string;
  status: OrderStatus;
  shade?: string;
  deliveryDate: string;
  reworkCount: number;
  modelReceived: boolean;
  currentHandler: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  operatorRole: UserRoleType;
  remark?: string;
  createdAt: string;
}

export interface ReworkRecord {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  applicant: string;
  handler: string;
  status: 'pending' | 'processing' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface ColorConfirm {
  id: string;
  orderId: string;
  shade: string;
  operator: string;
  confirmed: boolean;
  remark?: string;
  createdAt: string;
}

export const SHADE_COLORS = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4'
] as const;

export const REWORK_REASONS = [
  '色号不符',
  '形态不佳',
  '咬合问题',
  '边缘不密合',
  '邻接关系问题',
  '其他'
] as const;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待处理',
  model_received: '模型已接收',
  color_confirmed: '色号已确认',
  in_production: '生产中',
  quality_check: '质检中',
  rework: '返工中',
  completed: '已完成'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  model_received: 'bg-blue-100 text-blue-700',
  color_confirmed: 'bg-green-100 text-green-700',
  in_production: 'bg-purple-100 text-purple-700',
  quality_check: 'bg-yellow-100 text-yellow-700',
  rework: 'bg-red-100 text-red-700',
  completed: 'bg-emerald-100 text-emerald-700'
};

export const ROLE_LABELS: Record<UserRoleType, string> = {
  customer_service: '接单客服',
  designer: '数字设计师',
  inspector: '质检员'
};

export const ROLE_COLORS: Record<UserRoleType, string> = {
  customer_service: 'bg-sky-100 text-sky-700',
  designer: 'bg-violet-100 text-violet-700',
  inspector: 'bg-amber-100 text-amber-700'
};
