const fs = require('fs');

const content = `export type UserRole = 'operator' | 'customs' | 'warehouse' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type PreparationOrderStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'AUDITING'
  | 'PENDING_SUPPLEMENT'
  | 'AUDIT_PASS'
  | 'WAREHOUSE_CONFIRM'
  | 'INVENTORY_LOCKED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PreparationItem {
  id: string;
  sku: string;
  skuName: string;
  quantity: number;
  unitPrice: number;
  weight?: number;
}

export interface PreparationOrder {
  id: string;
  orderNo: string;
  status: PreparationOrderStatus;
  warehouseCode: string;
  warehouseName: string;
  creator: string;
  creatorName: string;
  items: PreparationItem[];
  totalQuantity: number;
  totalAmount: number;
  customsDocId?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  estimatedArrival?: string;
}

export type InventoryLockStatus = 'PENDING' | 'LOCKED' | 'RELEASED' | 'EXPIRED';

export interface InventoryLock {
  id: string;
  lockNo: string;
  status: InventoryLockStatus;
  sku: string;
  skuName: string;
  lockQuantity: number;
  bizType: 'preparation' | 'order' | 'return';
  bizId: string;
  bizNo?: string;
  expireAt: string;
  locker: string;
  lockerName: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  warehouseCode: string;
  warehouseName: string;
}

export interface SkuInventory {
  id: string;
  sku: string;
  skuName: string;
  availableQuantity: number;
  lockQuantity: number;
  totalQuantity: number;
  warehouseCode: string;
  warehouseName: string;
  lastUpdated: string;
}

export type CustomsDocStatus =
  | 'DRAFT'
  | 'PENDING_DECLARE'
  | 'DECLARING'
  | 'PENDING_SUPPLEMENT'
  | 'DECLARED'
  | 'CLEARED'
  | 'REJECTED';

export interface CustomsDoc {
  id: string;
  docNo: string;
  preparationId: string;
  preparationOrderNo: string;
  status: CustomsDocStatus;
  customsCode: string;
  customsName: string;
  declareAt?: string;
  clearAt?: string;
  supplementItems?: string[];
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnReasonCode =
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'QUALITY'
  | 'CUSTOMS_REJECT'
  | 'OVERSTOCK'
  | 'OTHER';

export interface ReturnRecord {
  id: string;
  returnNo: string;
  preparationId?: string;
  preparationOrderNo?: string;
  sku: string;
  skuName: string;
  quantity: number;
  reasonCode: ReturnReasonCode;
  reasonDesc: string;
  handler: string;
  handlerName: string;
  warehouseCode: string;
  warehouseName: string;
  remark?: string;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  bizType: 'preparation' | 'inventory_lock' | 'customs' | 'return';
  bizId: string;
  operation: string;
  operator: string;
  operatorName: string;
  operateAt: string;
  detail?: string;
  fromStatus?: string;
  toStatus?: string;
  remark?: string;
}

export interface RiskAlert {
  id: string;
  type: 'oversell' | 'low_stock' | 'customs_overdue' | 'lock_expire';
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export interface DashboardStats {
  pendingAudit: number;
  pendingSupplement: number;
  pendingLock: number;
  totalRisk: number;
  highRisk: number;
}

export const PREPARATION_STATUS_MAP: Record<PreparationOrderStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  PENDING_AUDIT: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  AUDITING: { label: '关务审核中', color: 'bg-blue-100 text-blue-700' },
  PENDING_SUPPLEMENT: { label: '待补件', color: 'bg-orange-100 text-orange-700' },
  AUDIT_PASS: { label: '审核通过', color: 'bg-green-100 text-green-700' },
  WAREHOUSE_CONFIRM: { label: '仓配确认', color: 'bg-cyan-100 text-cyan-700' },
  INVENTORY_LOCKED: { label: '已锁库', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: '已发运', color: 'bg-indigo-100 text-indigo-700' },
  RECEIVED: { label: '已入库', color: 'bg-teal-100 text-teal-700' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
};

export const INVENTORY_LOCK_STATUS_MAP: Record<InventoryLockStatus, { label: string; color: string }> = {
  PENDING: { label: '待锁定', color: 'bg-yellow-100 text-yellow-700' },
  LOCKED: { label: '已锁定', color: 'bg-blue-100 text-blue-700' },
  RELEASED: { label: '已释放', color: 'bg-gray-100 text-gray-700' },
  EXPIRED: { label: '已过期', color: 'bg-red-100 text-red-700' },
};

export const CUSTOMS_STATUS_MAP: Record<CustomsDocStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  PENDING_DECLARE: { label: '待申报', color: 'bg-yellow-100 text-yellow-700' },
  DECLARING: { label: '申报中', color: 'bg-blue-100 text-blue-700' },
  PENDING_SUPPLEMENT: { label: '待补件', color: 'bg-orange-100 text-orange-700' },
  DECLARED: { label: '已申报', color: 'bg-cyan-100 text-cyan-700' },
  CLEARED: { label: '已通关', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已驳回', color: 'bg-red-100 text-red-700' },
};

export const RETURN_REASON_MAP: Record<ReturnReasonCode, string> = {
  DAMAGED: '破损',
  WRONG_ITEM: '错发',
  QUALITY: '质量问题',
  CUSTOMS_REJECT: '海关驳回',
  OVERSTOCK: '库存积压',
  OTHER: '其他',
};
`;

fs.writeFileSync('src/types/index.ts', content);
console.log('Done! File size:', content.length, 'bytes');
