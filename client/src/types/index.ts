export type UserRole = 'clerk' | 'courier' | 'customer_service';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}

export interface DailyOrder {
  id: number;
  delivery_date: string;
  subscription_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  route_id: number | null;
  status: 'pending' | 'signed' | 'exception' | 'replenished';
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  product_name?: string;
  product_spec?: string;
  route_name?: string;
  exception_id?: number | null;
  exception_type?: string | null;
  exception_status?: string | null;
  exception_description?: string | null;
}

export interface MorningCheckin {
  id: number;
  checkin_date: string;
  route_id: number;
  courier_id: number;
  clerk_id: number | null;
  total_orders: number;
  signed_orders: number;
  exception_orders: number;
  status: 'draft' | 'submitted' | 'confirmed';
  remark: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  route_name?: string;
  courier_name?: string;
  clerk_name?: string;
}

export type ExceptionType = 'missed' | 'damaged' | 'wrong_product' | 'customer_absent' | 'other';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Exception {
  id: number;
  daily_order_id: number;
  checkin_id: number | null;
  reported_by: number;
  type: ExceptionType;
  description: string | null;
  status: ExceptionStatus;
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  customer_name?: string;
  customer_address?: string;
  product_name?: string;
  product_spec?: string;
  route_name?: string;
  reporter_name?: string;
}

export type ReplenishmentMethod = 'redelivery' | 'refund' | 'replace';
export type ReplenishmentStatus = 'pending' | 'delivered' | 'confirmed' | 'cancelled';

export interface Replenishment {
  id: number;
  exception_id: number;
  daily_order_id: number;
  handled_by: number;
  confirmed_by: number | null;
  quantity: number;
  method: ReplenishmentMethod;
  status: ReplenishmentStatus;
  remark: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  exception_type?: string;
  exception_description?: string;
  delivery_date?: string;
  customer_name?: string;
  customer_address?: string;
  product_name?: string;
  handler_name?: string;
  confirmer_name?: string;
}

export interface TimelineEvent {
  type: string;
  time: string;
  title: string;
  description: string;
  user: string | null;
}
