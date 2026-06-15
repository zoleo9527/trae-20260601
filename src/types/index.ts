export interface SKU {
  id: string;
  name: string;
  brand: string;
  spec: string;
  unit: string;
  safetyStock: number;
  maxStock: number;
}

export interface Batch {
  id: string;
  skuId: string;
  batchNo: string;
  quantity: number;
  arrivalDate: string;
  expireDate: string;
  status: 'normal' | 'expiring' | 'expired';
}

export interface BatchAdjustment {
  id: string;
  skuId: string;
  originalBatchId: string;
  newBatchId: string;
  adjustQuantity: number;
  reason: string;
  applicant: string;
  applyTime: string;
  createTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approver?: string;
  approveTime?: string;
  rejectReason?: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadTime: string;
  uploader: string;
}

export interface InventoryAlert {
  id: string;
  skuId: string;
  currentStock: number;
  safetyStock: number;
  alertLevel: 'red' | 'orange' | 'yellow';
  status: 'pending' | 'processing' | 'resolved';
  createTime: string;
  handler?: string;
  handleTime?: string;
  handleResult?: string;
  relatedAdjustments: string[];
}

export interface Notification {
  id: string;
  type: 'adjustment' | 'alert' | 'system';
  title: string;
  content: string;
  targetRole: 'clerk' | 'manager' | 'buyer' | 'all';
  read: boolean;
  createTime: string;
  relatedId: string;
}

export interface Task {
  id: string;
  type: 'adjustment_audit' | 'emergency_adjustment' | 'alert_response' | 'purchase_confirm';
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed';
  assignee: string;
  createTime: string;
  dueTime?: string;
  relatedData: string;
}

export interface User {
  id: string;
  name: string;
  role: 'clerk' | 'manager' | 'buyer';
  storeId: string;
  storeName: string;
}

export type Role = 'clerk' | 'manager' | 'buyer';
