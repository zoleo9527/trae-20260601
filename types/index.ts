export type OrderStatus = 
  | 'pending_sync' 
  | 'syncing' 
  | 'synced' 
  | 'sync_failed' 
  | 'pending_customs' 
  | 'customs_processing' 
  | 'completed' 
  | 'exception';

export type CustomsStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'reviewed' 
  | 'rejected' 
  | 'completed';

export type ResponsibilityFlag = 
  | 'none' 
  | 'pending_confirm' 
  | 'operation' 
  | 'customs';

export type UserRole = 'operation' | 'customs' | 'warehouse';

export type TimelineEventType = 
  | 'sync' 
  | 'customs' 
  | 'comment' 
  | 'status_change' 
  | 'responsibility'
  | 'system';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  operator: string;
  operatorRole: UserRole | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface OrderSkuItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNo: string;
  platform: string;
  platformOrderNo: string;
  buyerName: string;
  buyerCountry: string;
  totalAmount: number;
  currency: string;
  skuList: OrderSkuItem[];
  status: OrderStatus;
  responsibilityFlag: ResponsibilityFlag;
  syncCount: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface CustomsDocument {
  id: string;
  orderId: string;
  orderNo: string;
  version: number;
  status: CustomsStatus;
  declarationNo?: string;
  exporter: string;
  importer: string;
  goodsDescription: string;
  hsCode: string;
  declaredValue: number;
  currency: string;
  weight: number;
  quantity: number;
  submitter?: string;
  reviewer?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  warehouse: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  warningThreshold: number;
}

export interface DashboardStats {
  totalOrders: number;
  todaySynced: number;
  pendingCustoms: number;
  customsPassRate: number;
  exceptionOrders: number;
  pendingResponsibility: number;
  inventoryWarnings: number;
}

export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
