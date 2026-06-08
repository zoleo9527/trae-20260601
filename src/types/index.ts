export type ScheduleStatus = 'PENDING' | 'DEPARTED' | 'RETURNED' | 'SETTLED'

export type SettlementStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export type ExceptionType = 'DELAY' | 'VEHICLE_CHANGE' | 'EMPTY_TRIP' | 'OVERTIME' | 'OTHER'

export type RejectionStatus = 'PENDING' | 'RESOLVED'

export type RejectionCategory = 'amount_anomaly' | 'voucher_missing' | 'timeout_dispute' | 'other'

export type RoleName = 'dispatcher' | 'fleet_manager' | 'finance' | 'supervisor'

export type EntityType = 'schedule' | 'settlement' | 'exception'

export type ActionType =
  | 'create'
  | 'edit'
  | 'depart'
  | 'return'
  | 'settle'
  | 'approve'
  | 'reject'
  | 'resubmit'
  | 'supplement'
  | 'exception_mark'

export interface Vehicle {
  id: string
  plateNo: string
  type: string
  seatCount: number
  status: 'available' | 'maintenance' | 'assigned'
}

export interface Schedule {
  id: string
  tripNo: string
  vehicleId: string
  driverName: string
  guideName: string
  departTime: string
  expectedReturn: string
  actualReturn: string
  status: ScheduleStatus
  isSupplement: boolean
  remark: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id: string
  scheduleId: string
  baseFee: number
  overtimeFee: number
  tollFee: number
  parkingFee: number
  totalFee: number
  status: SettlementStatus
  reviewedBy: string
  reviewedAt: string
  createdBy: string
  createdAt: string
}

export interface Rejection {
  id: string
  settlementId: string
  category: RejectionCategory
  reason: string
  rejectedBy: string
  rejectedAt: string
  resubmittedBy: string
  resubmittedAt: string
  status: RejectionStatus
}

export interface ExceptionRecord {
  id: string
  scheduleId: string
  type: ExceptionType
  description: string
  reportedBy: string
  reportedAt: string
  status: 'pending' | 'resolved'
}

export interface OperationLog {
  id: string
  entityType: EntityType
  entityId: string
  action: ActionType
  operator: string
  operatorRole: RoleName
  operatedAt: string
  beforeValue: Record<string, unknown> | null
  afterValue: Record<string, unknown> | null
}

export interface RiskItem {
  id: string
  type: 'settlement_anomaly' | 'schedule_conflict' | 'overdue_settlement' | 'rejection_overdue'
  severity: 'high' | 'medium' | 'low'
  message: string
  relatedId: string
  read: boolean
}

export interface RoleConfig {
  name: RoleName
  label: string
  permissions: string[]
}

export const SCHEDULE_STATUS_MAP: Record<ScheduleStatus, string> = {
  PENDING: '待出车',
  DEPARTED: '已出车',
  RETURNED: '已回车',
  SETTLED: '已结算',
}

export const SETTLEMENT_STATUS_MAP: Record<SettlementStatus, string> = {
  PENDING_REVIEW: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
}

export const EXCEPTION_TYPE_MAP: Record<ExceptionType, string> = {
  DELAY: '延误',
  VEHICLE_CHANGE: '换车',
  EMPTY_TRIP: '空驶',
  OVERTIME: '超时',
  OTHER: '其他',
}

export const REJECTION_STATUS_MAP: Record<RejectionStatus, string> = {
  PENDING: '待处理',
  RESOLVED: '已处理',
}

export const REJECTION_CATEGORY_MAP: Record<RejectionCategory, { label: string; color: string; bgColor: string; borderColor: string }> = {
  amount_anomaly: { label: '金额异常', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  voucher_missing: { label: '凭证缺失', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  timeout_dispute: { label: '超时争议', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  other: { label: '其他', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
}

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    name: 'dispatcher',
    label: '调度员',
    permissions: ['schedule:create', 'schedule:edit', 'settlement:resubmit', 'exception:create'],
  },
  {
    name: 'fleet_manager',
    label: '车队管理员',
    permissions: ['schedule:depart', 'schedule:return', 'exception:create'],
  },
  {
    name: 'finance',
    label: '财务结算员',
    permissions: ['settlement:review', 'settlement:approve', 'settlement:reject'],
  },
  {
    name: 'supervisor',
    label: '运营主管',
    permissions: ['settlement:review', 'log:view', 'dashboard:view'],
  },
]
