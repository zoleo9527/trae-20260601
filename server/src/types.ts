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
