export type UserRole = 'dispatcher' | 'forklift' | 'clerk';

export type RecordStatus =
  | 'pending'
  | 'checkin'
  | 'unloading'
  | 'finished'
  | 'discrepancy'
  | 'completed';

export type DiscrepancyType = 'quantity' | 'damage' | 'other';

export type DockStatus = 'idle' | 'occupied' | 'exception';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export interface Dock {
  id: string;
  number: number;
  status: DockStatus;
  currentRecordId?: string;
}

export interface UnloadRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  cargoType: string;
  plannedQuantity: number;
  actualQuantity?: number;
  dockId?: string;
  dockNumber?: number;
  status: RecordStatus;
  checkinTime?: string;
  startTime?: string;
  endTime?: string;
  discrepancyType?: DiscrepancyType;
  discrepancyQuantity?: number;
  returnReason?: string;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  recordId: string;
  operation: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operateTime: string;
  remark?: string;
  returnReason?: string;
  discrepancyRemark?: string;
}

export interface DashboardData {
  todoCounts: {
    pendingCheckin: number;
    pendingUnload: number;
    pendingDiscrepancy: number;
  };
  recentStatus: OperationLog[];
  dockStatus: Dock[];
}

export interface CreateRecordRequest {
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  cargoType: string;
  plannedQuantity: number;
  dockId?: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export interface UpdateStatusRequest {
  status: RecordStatus;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  remark?: string;
}

export interface DiscrepancyRequest {
  discrepancyType: DiscrepancyType;
  discrepancyQuantity: number;
  actualQuantity: number;
  returnReason?: string;
  remark?: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export interface AssignDockRequest {
  recordId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export interface BatchAssignDockRequest {
  recordIds: string[];
  dockIds: string[];
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export interface BatchCheckInRequest {
  recordIds: string[];
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export interface CompleteNoDiscrepancyRequest {
  actualQuantity: number;
  remark?: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待签到',
  checkin: '已签到',
  unloading: '卸货中',
  finished: '卸货完成',
  discrepancy: '差异登记中',
  completed: '已完成',
};

export const STATUS_COLORS: Record<RecordStatus, string> = {
  pending: 'bg-gray-500',
  checkin: 'bg-blue-500',
  unloading: 'bg-amber-500',
  finished: 'bg-cyan-500',
  discrepancy: 'bg-orange-500',
  completed: 'bg-emerald-500',
};

export const DISCREPANCY_LABELS: Record<DiscrepancyType, string> = {
  quantity: '数量差异',
  damage: '破损',
  other: '其他',
};

export const DOCK_STATUS_LABELS: Record<DockStatus, string> = {
  idle: '空闲',
  occupied: '使用中',
  exception: '异常',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  dispatcher: '调度员',
  forklift: '叉车班长',
  clerk: '仓库文员',
};
