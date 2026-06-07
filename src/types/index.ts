export type UserRole = 'station_clerk' | 'delivery_person' | 'customer_service';

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
  | 'resolve_alert';

export interface OperationLog {
  id: string;
  operationType: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  targetType: 'bottle_return' | 'deposit_reconciliation' | 'alert';
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
