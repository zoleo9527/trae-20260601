export interface User {
  id: string;
  name: string;
  role: 'manager' | 'supervisor' | 'purchaser';
  storeName: string;
  region?: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  safetyStock: number;
}

export type OutOfStockStatus = 'pending' | 'approved' | 'rejected' | 'replenished' | 'closed';

export type ReplenishStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OutOfStockRecord {
  id: string;
  dishId: string;
  dishName: string;
  storeId: string;
  storeName: string;
  region: string;
  quantity: number;
  reason: string;
  remark: string;
  status: OutOfStockStatus;
  submitterId: string;
  submitterName: string;
  submitTime: string;
  approverId?: string;
  approverName?: string;
  approveTime?: string;
  rejectReason?: string;
  replenishOrderId?: string;
  closeTime?: string;
}

export interface ReplenishOrder {
  id: string;
  outOfStockId: string;
  dishId: string;
  dishName: string;
  storeId: string;
  storeName: string;
  region: string;
  requestedQuantity: number;
  actualQuantity: number;
  status: ReplenishStatus;
  remark: string;
  submitterId: string;
  submitterName: string;
  submitTime: string;
  confirmerId?: string;
  confirmerName?: string;
  confirmTime?: string;
  completionTime?: string;
  cancelReason?: string;
}

export interface OperationLog {
  id: string;
  type: 'out_of_stock' | 'replenish';
  targetId: string;
  action: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  storeName: string;
  region: string;
  detail: string;
  operationTime: string;
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
