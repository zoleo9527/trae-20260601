export type RequestType = 'return' | 'exchange';

export type RequestStatus = 
  | 'draft' 
  | 'pending_warehouse' 
  | 'warehouse_confirmed' 
  | 'pending_reissue' 
  | 'reissuing' 
  | 'completed' 
  | 'cancelled';

export type ReissueStatus = 
  | 'pending' 
  | 'picking' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type UserRole = 'customer_service' | 'warehouse_manager' | 'driver';

export interface SalesOrder {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone?: string;
  address?: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivered_at?: string;
  items?: OrderItem[];
  delivery_receipt?: DeliveryReceipt;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price?: number;
  unit?: string;
  warehouse_location?: string;
}

export interface DeliveryReceipt {
  id: string;
  order_id: string;
  receipt_no: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_no?: string;
  delivery_date?: string;
  status: string;
  signer_name?: string;
  sign_time?: string;
  remarks?: string;
}

export interface ReturnExchangeRequest {
  id: string;
  request_no: string;
  order_id: string;
  type: RequestType;
  status: RequestStatus;
  reason?: string;
  reason_category?: string;
  applicant: string;
  applicant_role: UserRole;
  warehouse_confirmer?: string;
  warehouse_confirm_time?: string;
  reissue_handler?: string;
  reissue_handle_time?: string;
  completer?: string;
  complete_time?: string;
  created_at: string;
  updated_at: string;
  remarks?: string;
  order_no?: string;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
  total_amount?: number;
  item_count?: number;
  returnItems?: ReturnItem[];
  reissue?: ReissueTracking & { items: ReissueItem[] } | null;
  logs?: OperationLog[];
  attachments?: Attachment[];
}

export interface ReturnItem {
  id: string;
  request_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit?: string;
  warehouse_location?: string;
  actual_quantity?: number;
  inspection_result?: string;
  inspection_remark?: string;
}

export interface ReissueTracking {
  id: string;
  request_id: string;
  tracking_no?: string;
  status: ReissueStatus;
  handler?: string;
  handler_role?: UserRole;
  warehouse_location?: string;
  driver_name?: string;
  vehicle_no?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  signer_name?: string;
  sign_time?: string;
  created_at: string;
  updated_at: string;
  remarks?: string;
  request_no?: string;
  request_type?: RequestType;
  request_status?: RequestStatus;
  order_no?: string;
  customer_name?: string;
  address?: string;
  item_count?: number;
  items?: ReissueItem[];
  logs?: OperationLog[];
  attachments?: Attachment[];
}

export interface ReissueItem {
  id: string;
  reissue_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit?: string;
  warehouse_location?: string;
}

export interface OperationLog {
  id: string;
  request_id?: string;
  reissue_id?: string;
  action: string;
  operator: string;
  operator_role: UserRole;
  detail?: string;
  old_status?: string;
  new_status?: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  request_id?: string;
  reissue_id?: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_path?: string;
  placeholder: boolean;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface WarehouseLocation {
  id: string;
  location_code: string;
  location_name: string;
  area?: string;
  capacity?: number;
  status: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const REQUEST_STATUS_MAP: Record<RequestStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_warehouse: { label: '待仓库确认', color: 'warning' },
  warehouse_confirmed: { label: '仓库已确认', color: 'processing' },
  pending_reissue: { label: '待补发', color: 'warning' },
  reissuing: { label: '补发中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

export const REISSUE_STATUS_MAP: Record<ReissueStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  picking: { label: '拣货中', color: 'processing' },
  shipped: { label: '已发货', color: 'processing' },
  out_for_delivery: { label: '派送中', color: 'processing' },
  delivered: { label: '已签收', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

export const REQUEST_TYPE_MAP: Record<RequestType, { label: string; color: string }> = {
  return: { label: '退货', color: 'orange' },
  exchange: { label: '换货', color: 'blue' },
};

export const USER_ROLE_MAP: Record<UserRole, string> = {
  customer_service: '客服',
  warehouse_manager: '仓库主管',
  driver: '司机',
};

export const REASON_CATEGORIES = [
  '包装破损',
  '数量差异',
  '质量问题',
  '发错货物',
  '客户原因',
  '其他',
];
