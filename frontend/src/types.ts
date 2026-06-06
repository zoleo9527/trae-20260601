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

export interface StatsSummary {
  total: number;
  pendingReview: number;
  giftConfiguring: number;
  rejected: number;
  completed: number;
  urgent: number;
}

export const RoleNames: Record<Role, string> = {
  ASSISTANT: '主播助理',
  STAGE_CONTROL: '场控',
  AFTER_SALES_LEAD: '售后组长'
};

export const StatusNames: Record<InventoryStatus, string> = {
  DRAFT: '草稿',
  PENDING_LOCK: '待锁定',
  LOCKED: '已锁定',
  PENDING_REVIEW: '待审核',
  REVIEW_REJECTED: '审核驳回',
  GIFT_CONFIGURING: '赠品配置中',
  GIFT_CONFIGURED: '赠品已配置',
  COMPLETED: '已完成',
  RETURNED: '已退回'
};

export const StatusColors: Record<InventoryStatus, string> = {
  DRAFT: 'default',
  PENDING_LOCK: 'processing',
  LOCKED: 'processing',
  PENDING_REVIEW: 'warning',
  REVIEW_REJECTED: 'error',
  GIFT_CONFIGURING: 'processing',
  GIFT_CONFIGURED: 'processing',
  COMPLETED: 'success',
  RETURNED: 'error'
};

export const PriorityNames: Record<Priority, string> = {
  NORMAL: '普通',
  URGENT: '紧急',
  EXTREME: '特急'
};

export const PriorityColors: Record<Priority, string> = {
  NORMAL: 'default',
  URGENT: 'orange',
  EXTREME: 'red'
};
