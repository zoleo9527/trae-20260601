export type OutboundStatus =
  | "pending_submit"
  | "pending_review"
  | "reviewing"
  | "completed"
  | "has_issue"
  | "closed";

export interface OutboundOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerQualExpiry: string;
  status: OutboundStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundItem {
  id: string;
  orderId: string;
  consumableName: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  stockQty: number;
  outboundQty: number;
  reviewStatus: "pending" | "normal" | "abnormal";
  abnormalType: string | null;
  abnormalNote: string | null;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  operatorRole: string;
  detail: string;
  createdAt: string;
}

export interface ReviewSnapshot {
  id: string;
  orderId: string;
  reviewedBy: string;
  reviewAt: string;
  items: ReviewSnapshotItem[];
}

export interface ReviewSnapshotItem {
  id: string;
  snapshotId: string;
  itemId: string;
  consumableName: string;
  batchNo: string;
  result: "normal" | "abnormal";
  abnormalType: string | null;
  abnormalNote: string | null;
}

export interface BatchIssue {
  id: string;
  orderId: string;
  orderNo: string;
  itemId: string;
  consumableName: string;
  batchNo: string;
  abnormalType: "batch_error" | "near_expiry" | "expired" | "qual_expired";
  abnormalNote: string;
  processStatus: "pending" | "processed";
  processResult: "exchange" | "return" | "special_approval" | null;
  processNote: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface CreateOutboundOrderRequest {
  orderNo: string;
  customerId: string;
  customerName: string;
  customerQualExpiry: string;
  items: CreateOutboundItem[];
  idempotencyKey: string;
}

export interface CreateOutboundItem {
  consumableName: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  stockQty: number;
  outboundQty: number;
}

export interface SubmitOutboundOrderRequest {
  submittedBy: string;
  idempotencyKey: string;
}

export interface ReviewOutboundOrderRequest {
  reviewedBy: string;
  reviewItems: ReviewItemInput[];
  idempotencyKey: string;
}

export interface ReviewItemInput {
  itemId: string;
  result: "normal" | "abnormal";
  abnormalType?: "batch_error" | "near_expiry" | "expired" | "qual_expired";
  abnormalNote?: string;
}

export interface ProcessBatchIssueRequest {
  processedBy: string;
  processResult: "exchange" | "return" | "special_approval";
  processNote: string;
  newBatchNo?: string;
  newExpiryDate?: string;
  idempotencyKey: string;
}
