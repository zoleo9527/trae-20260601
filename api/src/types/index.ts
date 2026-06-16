export interface Store {
  id: number;
  name: string;
  region: string;
  address: string;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  role: 'manager' | 'supervisor' | 'purchaser';
  storeId: number | null;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  spec: string;
  unit: string;
  category: string;
  isCold: boolean;
  createdAt: string;
}

export interface StockRequest {
  id: number;
  storeId: number;
  userId: number;
  productId: number;
  requestQty: number;
  reason: string;
  affectsBusiness: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'delivering' | 'delivered' | 'inspected';
  expectedDate: string;
  supervisorComment: string | null;
  confirmedQty: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: number;
  requestId: number;
  actualQty: number;
  actualSpec: string;
  temperature: number | null;
  isNormal: boolean;
  inspectorId: number;
  inspectedAt: string;
}

export interface Difference {
  id: number;
  inspectionId: number;
  type: 'shortage' | 'wrong_spec' | 'temperature' | 'other';
  description: string;
  status: 'pending' | 'processing' | 'resolved';
  handlerId: number | null;
  processedAt: string | null;
  processingResult: string | null;
}

export interface RequestWithDetails extends StockRequest {
  store: Store;
  user: User;
  product: Product;
  inspection?: Inspection;
  differences?: Difference[];
}

export interface CreateStockRequestDTO {
  storeId: number;
  userId: number;
  productId: number;
  requestQty: number;
  reason: string;
  affectsBusiness: boolean;
  expectedDate: string;
}

export interface UpdateStockRequestStatusDTO {
  status: StockRequest['status'];
  supervisorComment?: string;
  confirmedQty?: number;
}

export interface CreateInspectionDTO {
  requestId: number;
  actualQty: number;
  actualSpec: string;
  temperature: number | null;
  isNormal: boolean;
  inspectorId: number;
}

export interface CreateDifferenceDTO {
  inspectionId: number;
  type: Difference['type'];
  description: string;
}

export interface UpdateDifferenceStatusDTO {
  status: Difference['status'];
  processingResult?: string;
  handlerId?: number;
}
