export type UserRole = "assistant" | "controller" | "aftersales";

export type ReviewStatus =
  | "draft"
  | "pending"
  | "rejected"
  | "confirmed"
  | "processing"
  | "closed";

export type OrderStatus =
  | "pending"
  | "rejected"
  | "supplement"
  | "confirmed"
  | "processing"
  | "resolved";

export type OperationType =
  | "create"
  | "submit"
  | "reject"
  | "confirm"
  | "supplement"
  | "transfer"
  | "process"
  | "close";

export interface OperationLog {
  id: string;
  targetId: string;
  targetType: "review" | "order";
  operator: string;
  operatorRole: UserRole;
  operationType: OperationType;
  operationDesc: string;
  remark?: string;
  createdAt: string;
}

export interface AbnormalOrder {
  id: string;
  reviewId: string;
  orderNo: string;
  productName: string;
  productImage: string;
  buyerName: string;
  buyerPhone: string;
  amount: number;
  abnormalType: string;
  abnormalDesc: string;
  status: OrderStatus;
  rejectReason?: string;
  supplementRequired?: boolean;
  supplementNotes?: string;
  processResult?: string;
  operationLogs: OperationLog[];
  createdAt: string;
  updatedAt: string;
}

export interface LiveReview {
  id: string;
  sessionNo: string;
  liveTitle: string;
  anchorName: string;
  assistantName: string;
  startTime: string;
  endTime: string;
  duration: number;
  gmv: number;
  orderCount: number;
  viewerCount: number;
  status: ReviewStatus;
  siteRecords: string;
  oldLedger: string;
  chatScreenshots: string[];
  abnormalOrders: AbnormalOrder[];
  operationLogs: OperationLog[];
  createdAt: string;
  updatedAt: string;
  currentHandler: UserRole;
  rejectReason?: string;
  supplementRequired?: boolean;
  supplementNotes?: string;
  isOverdue?: boolean;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  keyword?: string;
  anchorName?: string;
  startDate?: string;
  endDate?: string;
  hasReject?: boolean;
  hasSupplement?: boolean;
  currentHandler?: UserRole;
  isOverdue?: boolean;
  todayUpdated?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
