export enum StaffRole {
  DORM_MANAGER = 'dorm_manager',
  COUNSELOR = 'counselor',
  MAINTENANCE = 'maintenance',
}

export enum CheckInStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
}

export enum AdjustmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  MAINTENANCE_REQUIRED = 'maintenance_required',
}

export enum AdjustmentReason {
  PERSONAL = 'personal',
  DORM_RELATION = 'dorm_relation',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  APPROVE = 'approve',
  REJECT = 'reject',
  RETURN = 'return',
  COMPLETE = 'complete',
  TRANSFER = 'transfer',
  COMMENT = 'comment',
}

export const StaffRoleLabel: Record<StaffRole, string> = {
  [StaffRole.DORM_MANAGER]: '宿管员',
  [StaffRole.COUNSELOR]: '辅导员',
  [StaffRole.MAINTENANCE]: '维修人员',
};

export const CheckInStatusLabel: Record<CheckInStatus, string> = {
  [CheckInStatus.PENDING]: '待处理',
  [CheckInStatus.IN_PROGRESS]: '处理中',
  [CheckInStatus.APPROVED]: '已通过',
  [CheckInStatus.REJECTED]: '已拒绝',
  [CheckInStatus.RETURNED]: '退回补充',
  [CheckInStatus.COMPLETED]: '已完成',
  [CheckInStatus.OVERDUE]: '逾期未处理',
  [CheckInStatus.DISPUTED]: '责任争议',
};

export const AdjustmentStatusLabel: Record<AdjustmentStatus, string> = {
  [AdjustmentStatus.PENDING]: '待处理',
  [AdjustmentStatus.IN_PROGRESS]: '处理中',
  [AdjustmentStatus.APPROVED]: '已通过',
  [AdjustmentStatus.REJECTED]: '已拒绝',
  [AdjustmentStatus.RETURNED]: '退回补充',
  [AdjustmentStatus.COMPLETED]: '已完成',
  [AdjustmentStatus.OVERDUE]: '逾期未处理',
  [AdjustmentStatus.DISPUTED]: '责任争议',
  [AdjustmentStatus.MAINTENANCE_REQUIRED]: '需维修配合',
};
