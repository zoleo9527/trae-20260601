
export type UserRole = 'admin' | 'service' | 'maintenance' | 'finance';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type StationStatus = 'normal' | 'warning' | 'offline';

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  deviceCount: number;
  onlineCount: number;
  status: StationStatus;
  partnerName: string;
  splitRatio: number;
  createdAt: string;
}

export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface Device {
  id: string;
  stationId: string;
  name: string;
  model: string;
  power: number;
  status: DeviceStatus;
  lastOnline: string;
}

export type FaultType = 'offline' | 'interrupt' | 'hardware' | 'network';
export type FaultSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FaultStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Fault {
  id: string;
  stationId: string;
  deviceId: string;
  deviceName: string;
  stationName: string;
  type: FaultType;
  severity: FaultSeverity;
  status: FaultStatus;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  workOrderId?: string;
}

export type TimelineType = 'detected' | 'assigned' | 'arrived' | 'repaired' | 'verified' | 'closed';

export interface FaultTimeline {
  id: string;
  faultId: string;
  type: TimelineType;
  title: string;
  description: string;
  createdAt: string;
  operator?: string;
}

export type WorkOrderStatus = 'pending' | 'accepted' | 'arrived' | 'processing' | 'completed' | 'timeout';
export type WorkOrderPriority = 'normal' | 'urgent';

export interface WorkOrder {
  id: string;
  faultId: string;
  stationId: string;
  stationName: string;
  deviceName: string;
  maintenanceId: string;
  maintenanceName: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedAt: string;
  estimatedArrival?: string;
  arrivedAt?: string;
  completedAt?: string;
  expectedDuration: number;
  actualDuration?: number;
}

export type OrderStatus = 'charging' | 'completed' | 'interrupted' | 'refunded';

export interface Order {
  id: string;
  stationId: string;
  stationName: string;
  deviceId: string;
  deviceName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  energy: number;
  amount: number;
  status: OrderStatus;
  faultId?: string;
  refundAmount?: number;
  refundReason?: string;
}

export type ComplaintType = 'device' | 'interrupt' | 'charge' | 'other';
export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export interface Complaint {
  id: string;
  orderId?: string;
  faultId?: string;
  stationId: string;
  userName: string;
  userPhone: string;
  type: ComplaintType;
  status: ComplaintStatus;
  description: string;
  createdAt: string;
  handler?: string;
  handleNotes?: string;
  handledAt?: string;
}

export type SettlementStatus = 'pending' | 'confirmed' | 'disputed' | 'completed';

export interface Settlement {
  id: string;
  date: string;
  stationId: string;
  stationName: string;
  totalAmount: number;
  platformShare: number;
  partnerShare: number;
  refundDeduction: number;
  finalPartnerShare: number;
  status: SettlementStatus;
}

export type AdjustmentType = 'refund' | 'compensation' | 'dispute';

export interface SettlementAdjustment {
  id: string;
  settlementId: string;
  stationId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  operator: string;
  createdAt: string;
}

export type DisputeStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface Dispute {
  id: string;
  settlementId: string;
  stationId: string;
  stationName: string;
  partnerName: string;
  disputedAmount: number;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  handler?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface DashboardStats {
  totalStations: number;
  onlineStations: number;
  activeFaults: number;
  pendingWorkOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingComplaints: number;
  pendingDisputes: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
