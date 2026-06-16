export interface User {
  id: string;
  name: string;
  role: 'manager' | 'supervisor' | 'purchaser';
  store_name: string;
  region?: string;
  storeName?: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  safety_stock: number;
  safetyStock?: number;
}

export type OutOfStockStatus = 'pending' | 'approved' | 'rejected' | 'replenished' | 'closed';

export type ReplenishStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OutOfStockRecord {
  id: string;
  dish_id: string;
  dish_name: string;
  store_id: string;
  store_name: string;
  region: string;
  quantity: number;
  reason: string;
  remark: string;
  status: OutOfStockStatus;
  submitter_id: string;
  submitter_name: string;
  submit_time: string;
  approver_id?: string;
  approver_name?: string;
  approve_time?: string;
  reject_reason?: string;
  replenish_order_id?: string;
  close_time?: string;
  dishId?: string;
  dishName?: string;
  storeId?: string;
  storeName?: string;
  submitterId?: string;
  submitterName?: string;
  submitTime?: string;
  approverId?: string;
  approverName?: string;
  approveTime?: string;
  rejectReason?: string;
  replenishOrderId?: string;
  closeTime?: string;
}

export interface ReplenishOrder {
  id: string;
  out_of_stock_id: string;
  dish_id: string;
  dish_name: string;
  store_id: string;
  store_name: string;
  region: string;
  requested_quantity: number;
  actual_quantity: number;
  status: ReplenishStatus;
  remark: string;
  submitter_id: string;
  submitter_name: string;
  submit_time: string;
  confirmer_id?: string;
  confirmer_name?: string;
  confirm_time?: string;
  completion_time?: string;
  cancel_reason?: string;
  outOfStockId?: string;
  dishId?: string;
  dishName?: string;
  storeId?: string;
  storeName?: string;
  requestedQuantity?: number;
  actualQuantity?: number;
  submitterId?: string;
  submitterName?: string;
  submitTime?: string;
  confirmerId?: string;
  confirmerName?: string;
  confirmTime?: string;
  completionTime?: string;
  cancelReason?: string;
}

export interface OperationLog {
  id: string;
  type: 'out_of_stock' | 'replenish';
  target_id: string;
  action: string;
  operator_id: string;
  operator_name: string;
  operator_role: string;
  store_name: string;
  region: string;
  detail: string;
  operation_time: string;
  targetId?: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  storeName?: string;
  operationTime?: string;
}

export interface OutOfStockQueryParams {
  status?: OutOfStockStatus;
  storeId?: string;
  region?: string;
  dishName?: string;
  startTime?: string;
  endTime?: string;
}

export interface ReplenishQueryParams {
  status?: ReplenishStatus;
  storeId?: string;
  region?: string;
  dishName?: string;
  startTime?: string;
  endTime?: string;
}
