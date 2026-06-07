export type UserRole = 'station_clerk' | 'delivery_person' | 'customer_service' | 'store_manager' | 'supervisor' | 'product_specialist';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export type BottleReturnStatus = 
  | 'pending_collection' 
  | 'collected' 
  | 'returned_to_station' 
  | 'verified' 
  | 'disputed' 
  | 'stuck'
  | 'rejected';

export type DepositReconciliationStatus = 
  | 'pending' 
  | 'matched' 
  | 'mismatched' 
  | 'pending_verification' 
  | 'verified' 
  | 'disputed'
  | 'stuck';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  depositBalance: number;
  totalBottlesHeld: number;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  deliveryPersonId: string;
  deliveryDate: string;
}

export interface BottleReturnRecord {
  id: string;
  customerId: string;
  customer: Customer;
  routeId: string;
  route: DeliveryRoute;
  expectedBottles: number;
  returnedBottles: number;
  status: BottleReturnStatus;
  collectedBy: string;
  collectedAt: string | null;
  returnedToStationAt: string | null;
  verifiedAt: string | null;
  reason: string | null;
  disputeReason: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  stuckReason?: string;
  stuckAt?: string;
}

export interface DepositReconciliation {
  id: string;
  customerId: string;
  customer: Customer;
  bottleReturnRecordId: string;
  bottleReturnRecord: BottleReturnRecord;
  expectedDeposit: number;
  actualDeposit: number;
  difference: number;
  status: DepositReconciliationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  reason: string | null;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
  stuckReason?: string;
  stuckAt?: string;
}

export type OperationType = 
  | 'bottle_collect'
  | 'bottle_return_station'
  | 'bottle_verify'
  | 'bottle_dispute'
  | 'bottle_reject'
  | 'bottle_stick'
  | 'bottle_unstick'
  | 'deposit_init'
  | 'deposit_match'
  | 'deposit_mismatch'
  | 'deposit_verify'
  | 'deposit_dispute'
  | 'deposit_stick'
  | 'deposit_unstick'
  | 'acknowledge_alert'
  | 'resolve_alert'
  | 'expiry_discover'
  | 'expiry_process'
  | 'expiry_submit_review'
  | 'review_accept'
  | 'review_reject'
  | 'review_request_supplement'
  | 'review_supplement'
  | 'review_approve'
  | 'expiry_complete'
  | 'expiry_reopen';

export interface OperationLog {
  id: string;
  operationType: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  targetType: 'bottle_return' | 'deposit_reconciliation' | 'alert' | 'near_expiry' | 'off_shelf_review';
  targetId: string;
  remark: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
}

export type AlertType = 'stuck_bottle' | 'stuck_deposit' | 'mismatched_deposit' | 'disputed';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  targetType: 'bottle_return' | 'deposit_reconciliation';
  targetId: string;
  status: AlertStatus;
  priority: 'high' | 'medium' | 'low';
  assignedRole?: UserRole;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface BottleReturnFilters {
  status?: BottleReturnStatus[];
  routeId?: string;
  customerId?: string;
  collectedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  hasStuck?: boolean;
}

export interface DepositReconciliationFilters {
  status?: DepositReconciliationStatus[];
  customerId?: string;
  verifiedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  hasDifference?: boolean;
  hasStuck?: boolean;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  managerId: string;
  phone: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  price: number;
  shelfLifeDays: number;
}

export type NearExpiryStatus =
  | 'pending_process'
  | 'marked_down'
  | 'donated'
  | 'returned'
  | 'destroyed'
  | 'pending_review'
  | 'review_rejected'
  | 'review_approved'
  | 'completed';

export type ReviewAction = 'approve' | 'reject' | 'request_supplement';

export interface NearExpiryRecord {
  id: string;
  storeId: string;
  store: Store;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  productionDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: NearExpiryStatus;
  processMethod?: 'mark_down' | 'donate' | 'return' | 'destroy';
  markdownPrice?: number;
  handledBy?: string;
  handledAt?: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemark?: string;
  rejectReason?: string;
  supplementRequest?: string;
  completedBy?: string;
  completedAt?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus =
  | 'pending'
  | 'under_review'
  | 'supplement_requested'
  | 'rejected'
  | 'approved';

export interface OffShelfReview {
  id: string;
  nearExpiryId: string;
  nearExpiryRecord: NearExpiryRecord;
  storeId: string;
  store: Store;
  status: ReviewStatus;
  currentHandlerRole: UserRole;
  submittedBy: string;
  submittedAt: string;
  firstReviewedBy?: string;
  firstReviewedAt?: string;
  firstReviewRemark?: string;
  finalReviewedBy?: string;
  finalReviewedAt?: string;
  finalReviewRemark?: string;
  rejectReason?: string;
  supplementRequest?: string;
  supplementSubmittedBy?: string;
  supplementSubmittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpiryOperationType =
  | 'expiry_discover'
  | 'expiry_process'
  | 'expiry_submit_review'
  | 'review_accept'
  | 'review_reject'
  | 'review_request_supplement'
  | 'review_supplement'
  | 'review_approve'
  | 'expiry_complete'
  | 'expiry_reopen';

export interface NearExpiryFilters {
  status?: NearExpiryStatus[];
  storeId?: string;
  productId?: string;
  handledBy?: string;
  dateFrom?: string;
  dateTo?: string;
  processMethod?: string;
}

export interface ReviewFilters {
  status?: ReviewStatus[];
  storeId?: string;
  currentHandlerRole?: UserRole[];
  submittedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
