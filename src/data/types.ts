export type PlateType = 'blue' | 'green' | 'yellow' | 'none';
export type VehicleType = 'sedan' | 'suv' | 'truck';
export type RentalStatus = 'pending' | 'auditing' | 'approved' | 'rejected' | 'dispatching' | 'completed' | 'failed';
export type NodeStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'stuck';
export type DispatchStatus = 'pending' | 'queued' | 'dispatching' | 'success' | 'failed';
export type DispatchNodeStatus = 'pending' | 'processing' | 'success' | 'failed';
export type OperatorRole = 'operation' | 'service' | 'maintenance';
export type OperatorStatus = 'online' | 'offline' | 'busy';
export type ExceptionType = 'permission_expired' | 'unlicensed_dispute' | 'gate_fault';
export type ExceptionPriority = 'high' | 'medium' | 'low';
export type ExceptionStatus = 'pending' | 'processing' | 'transferred' | 'closed';
export type RecentVisitType = 'audit' | 'dispatch' | 'exception';

export interface MonthlyRental {
  id: string;
  plateNumber: string;
  plateType: PlateType;
  ownerName: string;
  ownerPhone: string;
  vehicleType: VehicleType;
  parkingLot: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: RentalStatus;
  createdAt: string;
  auditId: string;
}

export interface AuditNode {
  id: string;
  name: string;
  status: NodeStatus;
  handler: string | null;
  handlerName?: string;
  startTime: string | null;
  endTime: string | null;
  remark: string | null;
  stuckReason?: string;
}

export interface AuditProcess {
  id: string;
  rentalId: string;
  currentNode: number;
  nodes: AuditNode[];
  createdAt: string;
  updatedAt: string;
  handlerId: string | null;
}

export interface DispatchNode {
  id: string;
  name: string;
  target: string;
  status: DispatchNodeStatus;
  startTime: string | null;
  endTime: string | null;
  errorCode?: string;
  errorMessage?: string;
  rawLog?: string;
}

export interface DispatchRecord {
  id: string;
  rentalId: string;
  plateNumber: string;
  status: DispatchStatus;
  nodes: DispatchNode[];
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  handlerId: string | null;
}

export interface Operator {
  id: string;
  name: string;
  role: OperatorRole;
  status: OperatorStatus;
  currentTaskCount: number;
  avatar: string;
}

export interface ProcessLog {
  id: string;
  operatorId: string;
  operatorName?: string;
  action: string;
  remark: string;
  timestamp: string;
}

export interface ExceptionOrder {
  id: string;
  type: ExceptionType;
  priority: ExceptionPriority;
  status: ExceptionStatus;
  plateNumber?: string;
  parkingLot: string;
  description: string;
  handlerId: string | null;
  handlerName?: string;
  logs: ProcessLog[];
  createdAt: string;
  updatedAt: string;
}

export interface RecentVisit {
  id: string;
  type: RecentVisitType;
  title: string;
  subtitle: string;
  path: string;
  timestamp: string;
}

export interface RiskItem {
  id: string;
  type: 'timeout' | 'expired' | 'gate_offline' | 'stuck';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedId: string;
  relatedType: 'audit' | 'dispatch' | 'exception';
  duration: string;
}

export interface ActivityItem {
  id: string;
  type: 'audit_pass' | 'audit_reject' | 'dispatch_success' | 'dispatch_fail' | 'exception_fix' | 'exception_create';
  title: string;
  description: string;
  operatorName: string;
  operatorRole: OperatorRole;
  timestamp: string;
  relatedId?: string;
  relatedType?: 'audit' | 'dispatch' | 'exception';
}

export interface TodoItem {
  id: string;
  type: 'audit' | 'dispatch_retry' | 'exception';
  title: string;
  subtitle: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing';
  handlerRole: OperatorRole[];
  path: string;
  createdAt: string;
}
