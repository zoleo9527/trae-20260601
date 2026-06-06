export type Role = 'ASSISTANT' | 'STAGE_CONTROL' | 'AFTER_SALES_LEAD';

export type InventoryStatus = 
  | 'DRAFT'
  | 'PENDING_LOCK'
  | 'LOCKED'
  | 'PENDING_REVIEW'
  | 'REVIEW_REJECTED'
  | 'GIFT_CONFIGURING'
  | 'GIFT_CONFIGURED'
  | 'COMPLETED'
  | 'RETURNED';

export type Priority = 'NORMAL' | 'URGENT' | 'EXTREME';

export interface SkuItem {
  skuId: string;
  skuName: string;
  originalPrice: number;
  livePrice: number;
  stockAvailable: number;
  stockLocked: number;
  unit: string;
}

export interface GiftItem {
  giftId: string;
  giftName: string;
  quantity: number;
  condition: string;
  stock: number;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  operator: string;
  role: Role;
  action: string;
  remark: string;
  fromStatus?: InventoryStatus;
  toStatus?: InventoryStatus;
}

export interface InventoryLockOrder {
  id: string;
  orderNo: string;
  liveSessionId: string;
  liveSessionName: string;
  skuList: SkuItem[];
  totalLockedAmount: number;
  priority: Priority;
  status: InventoryStatus;
  createdBy: string;
  createdByRole: Role;
  createdAt: string;
  updatedAt: string;
  currentHandler: string;
  currentHandlerRole: Role;
  giftList: GiftItem[];
  priceRemark: string;
  operationLogs: OperationLog[];
  rejectReason?: string;
  returnReason?: string;
  expectedLiveTime?: string;
}

export interface CreateLockOrderRequest {
  liveSessionId: string;
  liveSessionName: string;
  skuList: Omit<SkuItem, 'stockLocked'>[];
  priority: Priority;
  priceRemark: string;
  createdBy: string;
  expectedLiveTime?: string;
}

export interface ReviewRequest {
  orderId: string;
  approved: boolean;
  reviewer: string;
  remark: string;
  rejectReason?: string;
}

export interface GiftConfigRequest {
  orderId: string;
  giftList: GiftItem[];
  operator: string;
  remark: string;
}

export interface ReturnRequest {
  orderId: string;
  operator: string;
  reason: string;
}
