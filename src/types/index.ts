export type Role = 'OPERATION' | 'PRODUCT' | 'AUDITOR' | 'ANCHOR_ASSISTANT';

export type ScheduleStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'REVIEWED' 
  | 'APPROVED' 
  | 'LIVE' 
  | 'COMPLETED' 
  | 'CANCELLED'
  | 'RETURNED';

export type ProductStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'OFF_SHELF';

export type WorkflowActionType = 
  | 'CREATE' 
  | 'SUBMIT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'RETURN' 
  | 'SUPPLEMENT' 
  | 'START_LIVE' 
  | 'END_LIVE' 
  | 'CANCEL'
  | 'UPDATE';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  imageUrl: string;
  status: ProductStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ScheduleProduct {
  productId: string;
  productName: string;
  productSku: string;
  salePrice: number;
  plannedQuantity: number;
  displayOrder: number;
  isSelected: boolean;
}

export interface LiveSchedule {
  id: string;
  title: string;
  anchorName: string;
  assistantName: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  platform: string;
  status: ScheduleStatus;
  products: ScheduleProduct[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
}

export interface WorkflowRecord {
  id: string;
  bizType: 'SCHEDULE' | 'PRODUCT';
  bizId: string;
  bizVersion: number;
  actionType: WorkflowActionType;
  actionBy: string;
  actionAt: string;
  remark: string;
  previousStatus: string;
  newStatus: string;
  idempotencyKey: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}
