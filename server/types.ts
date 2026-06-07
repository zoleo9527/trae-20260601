export type UserRole = 'store_manager' | 'supervisor' | 'product_specialist';

export type InventoryDifferenceStatus = 'pending' | 'confirmed' | 'resolved' | 'appealed' | 'closed';
export type LossAnalysisStatus = 'recorded' | 'analyzing' | 'concluded' | 'archived';
export type AlertType = 'expiry_near' | 'price_tag_error' | 'out_of_stock' | 'restock_slow';
export type AlertStatus = 'active' | 'processing' | 'resolved' | 'ignored';
export type DifferenceType = 'overage' | 'shortage' | 'price_mismatch';
export type LossType = 'expired' | 'damaged' | 'stolen' | 'other';

export interface DifferenceHistoryItem {
  id: string;
  differenceId: string;
  timestamp: string;
  operator: string;
  action: string;
  content: string;
}

export interface AnalysisHistoryItem {
  id: string;
  analysisId: string;
  timestamp: string;
  operator: string;
  action: string;
  content: string;
}

export interface LossAnalysis {
  id: string;
  lossId: string;
  analyst: string;
  analyzedAt: string;
  rootCause?: string;
  preventiveMeasure?: string;
  responsibleParty?: string;
  conclusion?: string;
  history: AnalysisHistoryItem[];
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
  relatedLossIds?: string[];
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
  relatedDifferenceIds?: string[];
}

export interface Alert {
  id: string;
  alertNo: string;
  alertType: AlertType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
  sku?: string;
  title: string;
  description: string;
  status: AlertStatus;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  handledAt?: string;
  resolution?: string;
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
  keyword?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
