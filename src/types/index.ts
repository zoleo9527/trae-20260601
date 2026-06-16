export type OrderStatus = 'pending' | 'measured' | 'fabric_reserved' | 'pattern_in_progress' | 'fitting' | 'completed';

export type FabricStatus = 'pending' | 'reserved' | 'rejected' | 'supplement';

export type PatternStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export type UserRole = 'measurer' | 'pattern_maker' | 'customer_service';

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  order_date: string;
  status: OrderStatus;
  created_by: string;
  created_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  status_from: OrderStatus | null;
  status_to: OrderStatus;
  operator_id: string;
  operator_name: string;
  change_time: string;
  remark: string;
}

export interface FabricReservation {
  id: string;
  order_id: string;
  customer_name: string;
  fabric_name: string;
  fabric_code: string;
  quantity: number;
  status: FabricStatus;
  responsible_id: string;
  responsible_name: string;
  reserved_at: string;
  remark: string;
}

export interface FabricHistory {
  id: string;
  fabric_id: string;
  order_id: string;
  status_from: FabricStatus | null;
  status_to: FabricStatus;
  operator_id: string;
  operator_name: string;
  change_time: string;
  remark: string;
}

export interface PatternTask {
  id: string;
  order_id: string;
  customer_name: string;
  task_name: string;
  status: PatternStatus;
  assignee_id: string;
  assignee_name: string;
  scheduled_date: string;
  created_at: string;
  remark: string;
}

export interface PatternHistory {
  id: string;
  task_id: string;
  order_id: string;
  status_from: PatternStatus | null;
  status_to: PatternStatus;
  operator_id: string;
  operator_name: string;
  change_time: string;
  remark: string;
}

export interface Reminder {
  id: string;
  target_id: string;
  target_type: 'fabric' | 'pattern';
  operator_id: string;
  operator_name: string;
  reminder_time: string;
  remark: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: '待量体',
  measured: '已量体',
  fabric_reserved: '面料已预留',
  pattern_in_progress: '打版中',
  fitting: '试衣中',
  completed: '已完成',
};

export const FABRIC_STATUS_MAP: Record<FabricStatus, string> = {
  pending: '待确认',
  reserved: '已预留',
  rejected: '已退回',
  supplement: '需补料',
};

export const PATTERN_STATUS_MAP: Record<PatternStatus, string> = {
  pending: '待分配',
  in_progress: '打版中',
  completed: '已完成',
  rejected: '已退回',
};

export const ROLE_MAP: Record<UserRole, string> = {
  measurer: '量体师',
  pattern_maker: '版师',
  customer_service: '客服',
};