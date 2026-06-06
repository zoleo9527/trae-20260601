export enum AppointmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPPLEMENTED = 'supplemented',
  ASSIGNED = 'assigned',
  CHECKED_IN = 'checked_in',
  LOADING = 'loading',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  DISPATCHER = 'dispatcher',
  FORKMAN = 'forkman',
  CLERK = 'clerk',
}

export enum DockStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

export enum LogAction {
  CREATE = 'create',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  ASSIGN_DOCK = 'assign_dock',
  REASSIGN_DOCK = 'reassign_dock',
  CHECK_IN = 'check_in',
  START_LOADING = 'start_loading',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
  NOTE = 'note',
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Dock {
  id: string;
  code: string;
  name: string;
  status: DockStatus;
  zone?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusLog {
  id: string;
  appointmentId: string;
  action: LogAction;
  fromStatus?: AppointmentStatus;
  toStatus?: AppointmentStatus;
  operatorId: string;
  operatorName: string;
  remark?: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface Appointment {
  id: string;
  orderNo: string;
  carrierName: string;
  driverName: string;
  driverPhone: string;
  plateNumber: string;
  scheduledArrivalTime: string;
  actualArrivalTime?: string;
  cargoType: string;
  cargoWeight: number;
  warehouseZone?: string;
  status: AppointmentStatus;
  rejectionReason?: string;
  supplementNote?: string;
  creatorId?: string;
  creator?: User;
  approverId?: string;
  approver?: User;
  dockId?: string;
  dock?: Dock;
  dockAssignerId?: string;
  dockAssigner?: User;
  dockAssignedAt?: string;
  statusLogs?: StatusLog[];
  createdAt: string;
  updatedAt: string;
}

export const StatusTextMap: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待审核',
  [AppointmentStatus.APPROVED]: '已审核',
  [AppointmentStatus.REJECTED]: '已驳回',
  [AppointmentStatus.SUPPLEMENTED]: '已补录',
  [AppointmentStatus.ASSIGNED]: '已分配月台',
  [AppointmentStatus.CHECKED_IN]: '已签到',
  [AppointmentStatus.LOADING]: '作业中',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
};

export const StatusColorMap: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'orange',
  [AppointmentStatus.APPROVED]: 'blue',
  [AppointmentStatus.REJECTED]: 'red',
  [AppointmentStatus.SUPPLEMENTED]: 'cyan',
  [AppointmentStatus.ASSIGNED]: 'purple',
  [AppointmentStatus.CHECKED_IN]: 'geekblue',
  [AppointmentStatus.LOADING]: 'magenta',
  [AppointmentStatus.COMPLETED]: 'green',
  [AppointmentStatus.CANCELLED]: 'default',
};

export const ActionTextMap: Record<LogAction, string> = {
  [LogAction.CREATE]: '创建预约',
  [LogAction.APPROVE]: '审核通过',
  [LogAction.REJECT]: '驳回',
  [LogAction.SUPPLEMENT]: '补录信息',
  [LogAction.ASSIGN_DOCK]: '分配月台',
  [LogAction.REASSIGN_DOCK]: '调整月台',
  [LogAction.CHECK_IN]: '车辆签到',
  [LogAction.START_LOADING]: '开始作业',
  [LogAction.COMPLETE]: '作业完成',
  [LogAction.CANCEL]: '取消',
  [LogAction.NOTE]: '添加备注',
};

export const RoleTextMap: Record<UserRole, string> = {
  [UserRole.DISPATCHER]: '调度员',
  [UserRole.FORKMAN]: '叉车班长',
  [UserRole.CLERK]: '仓库文员',
};
