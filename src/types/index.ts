export type RoleType = 'operator' | 'customer_service' | 'maintenance';

export interface User {
  id: string;
  name: string;
  role: RoleType;
  avatar?: string;
}

export type ParkingOrderStatus =
  | 'pending_enter'
  | 'entered'
  | 'pending_pay'
  | 'paid'
  | 'pending_exit'
  | 'exited'
  | 'abnormal'
  | 'stuck';

export type AbnormalType =
  | 'gate_malfunction'
  | 'payment_timeout'
  | 'plate_recognition_error'
  | 'fee_dispute'
  | 'force_exit'
  | 'unknown';

export type RepairStatus =
  | 'pending'
  | 'processing'
  | 'pending_confirm'
  | 'completed'
  | 'failed';

export interface StatusLog {
  id: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  timestamp: string;
  remark: string;
}

export interface ParkingOrder {
  id: string;
  orderNo: string;
  plateNo: string;
  plateConfidence?: number;
  parkingLotId: string;
  parkingLotName: string;
  gateId?: string;
  gateName?: string;
  enterTime: string;
  exitTime?: string;
  parkingDuration?: number;
  baseFee: number;
  discountAmount: number;
  actualFee: number;
  paidAmount: number;
  status: ParkingOrderStatus;
  currentHandlerId?: string;
  currentHandlerName?: string;
  currentHandlerRole?: RoleType;
  stuckPoint?: string;
  abnormalType?: AbnormalType;
  abnormalTime?: string;
  abnormalDesc?: string;
  repairStatus?: RepairStatus;
  createTime: string;
  updateTime: string;
  statusLogs: StatusLog[];
  remarks: Remark[];
}

export interface Remark {
  id: string;
  orderId: string;
  content: string;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  timestamp: string;
}

export interface AbnormalRepair {
  id: string;
  repairNo: string;
  orderId: string;
  orderNo: string;
  plateNo: string;
  abnormalType: AbnormalType;
  abnormalTime: string;
  abnormalDesc: string;
  repairStatus: RepairStatus;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: RoleType;
  currentStep: string;
  blockerReason?: string;
  feeAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  createTime: string;
  updateTime: string;
  repairLogs: RepairLog[];
}

export interface RepairLog {
  id: string;
  repairId: string;
  step: string;
  action: string;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  timestamp: string;
  remark: string;
  result?: string;
}

export interface GateAbnormalLog {
  id: string;
  parkingLotId: string;
  parkingLotName: string;
  gateId: string;
  gateName: string;
  abnormalType: string;
  abnormalTime: string;
  status: string;
  handlerName?: string;
}

export interface MonthlyRentalInfo {
  id: string;
  plateNo: string;
  ownerName: string;
  parkingLotId: string;
  validUntil: string;
  status: 'active' | 'expired';
}

export interface ParkingLotLog {
  id: string;
  parkingLotId: string;
  parkingLotName: string;
  plateNo: string;
  action: 'enter' | 'exit';
  timestamp: string;
  gateName: string;
  operator?: string;
}

export interface DashboardStats {
  totalOrders: number;
  stuckOrders: number;
  abnormalOrders: number;
  pendingRepairs: number;
  processingRepairs: number;
  totalUnpaidAmount: number;
  operatorTodo: number;
  customerServiceTodo: number;
  maintenanceTodo: number;
}
