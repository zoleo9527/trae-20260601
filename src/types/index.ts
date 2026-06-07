export type UserRole = 'store_manager' | 'supervisor' | 'product_specialist';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  storeId?: string;
  storeIds?: string[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  manager: string;
  supervisor: string;
  area: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  supplier: string;
}

export type InventoryCheckStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type InventoryDifferenceStatus = 'pending' | 'confirmed' | 'resolved' | 'appealed' | 'closed';

export type DifferenceType = 'overage' | 'shortage' | 'price_mismatch';

export type LossType = 'expired' | 'damaged' | 'stolen' | 'other';

export type LossAnalysisStatus = 'recorded' | 'analyzing' | 'concluded' | 'archived';

export type AlertType = 'expiry_near' | 'price_tag_error' | 'out_of_stock' | 'restock_slow';

export type AlertStatus = 'active' | 'processing' | 'resolved' | 'ignored';

export interface InventoryItem {
  id: string;
  checkId: string;
  productId: string;
  productName: string;
  sku: string;
  systemQuantity: number;
  actualQuantity: number;
  unit: string;
  costPrice: number;
  difference: number;
  differenceType?: DifferenceType;
  differenceAmount: number;
  remark?: string;
}

export interface InventoryCheck {
  id: string;
  checkNo: string;
  storeId: string;
  storeName: string;
  checkDate: string;
  checker: string;
  status: InventoryCheckStatus;
  totalItems: number;
  differenceCount: number;
  totalDifferenceAmount: number;
  items: InventoryItem[];
  createdAt: string;
  completedAt?: string;
  remark?: string;
}

export interface InventoryDifference {
  id: string;
  differenceNo: string;
  checkId: string;
  checkNo: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  sku: string;
  differenceType: DifferenceType;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  unit: string;
  costPrice: number;
  differenceAmount: number;
  status: InventoryDifferenceStatus;
  reporter: string;
  reportedAt: string;
  handler?: string;
  handledAt?: string;
  resolution?: string;
  history: DifferenceHistoryItem[];
  attachments?: string[];
}

export interface DifferenceHistoryItem {
  id: string;
  differenceId: string;
  timestamp: string;
  operator: string;
  action: string;
  content: string;
}

export interface LossRecord {
  id: string;
  lossNo: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  sku: string;
  lossType: LossType;
  quantity: number;
  unit: string;
  costPrice: number;
  lossAmount: number;
  reportedBy: string;
  reportedAt: string;
  description: string;
  status: LossAnalysisStatus;
  analysis?: LossAnalysis;
  attachments?: string[];
}

export interface LossAnalysis {
  id: string;
  lossId: string;
  analyst: string;
  analyzedAt: string;
  rootCause: string;
  preventiveMeasure: string;
  responsibleParty: string;
  conclusion: string;
  history: AnalysisHistoryItem[];
}

export interface AnalysisHistoryItem {
  id: string;
  analysisId: string;
  timestamp: string;
  operator: string;
  action: string;
  content: string;
}

export interface Alert {
  id: string;
  alertNo: string;
  alertType: AlertType;
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
  sku?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: AlertStatus;
  createdAt: string;
  assignee?: string;
  handledAt?: string;
  resolution?: string;
  dueDate?: string;
  relatedDifferenceId?: string;
  relatedLossId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DifferenceFilterParams {
  storeId?: string;
  status?: InventoryDifferenceStatus;
  differenceType?: DifferenceType;
  dateRange?: [string, string];
  keyword?: string;
}

export interface LossFilterParams {
  storeId?: string;
  status?: LossAnalysisStatus;
  lossType?: LossType;
  dateRange?: [string, string];
  keyword?: string;
}

export interface AlertFilterParams {
  storeId?: string;
  status?: AlertStatus;
  alertType?: AlertType;
  severity?: Alert['severity'];
  dateRange?: [string, string];
}
