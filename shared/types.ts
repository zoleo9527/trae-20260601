export type PackageStatus =
  | 'arrived'
  | 'checked_in'
  | 'notified'
  | 'verified'
  | 'problem'
  | 'returned'
  | 'completed'

export type PackageType = 'normal' | 'fragile' | 'oversized'

export type UserRole = 'dispatcher' | 'station_manager' | 'customer_service'

export type ProblemAction = 'recheckin' | 'return'

export interface TimelineEvent {
  id: number
  packageId: string
  status: PackageStatus
  operator: string
  role: UserRole
  timestamp: string
  note: string
  pickupPerson?: string | null
}

export interface PackageItem {
  id: string
  trackingNo: string
  status: PackageStatus
  type: PackageType
  arrivedAt: string
  currentHandler: string
  currentRole: UserRole
  problemType?: string
  problemDescription?: string
  timeline: TimelineEvent[]
}

export interface TodayStats {
  pendingCheckin: number
  pendingVerify: number
  problemCount: number
  todayCompleted: number
  overdueCheckin: number
  overdueVerify: number
}

export interface Activity {
  id: number
  packageId: string
  trackingNo: string
  action: string
  operator: string
  role: UserRole
  timestamp: string
}

export const STATUS_LABELS: Record<PackageStatus, string> = {
  arrived: '到站待入库',
  checked_in: '已入库待核销',
  notified: '已通知取件',
  verified: '已核销',
  problem: '问题件',
  returned: '已退回',
  completed: '已完成',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  dispatcher: '派件员',
  station_manager: '驿站负责人',
  customer_service: '网点客服',
}

export const OPERATOR_NAMES: Record<UserRole, string> = {
  dispatcher: '王建国',
  station_manager: '赵美丽',
  customer_service: '张秀英',
}

export const TYPE_LABELS: Record<PackageType, string> = {
  normal: '普通',
  fragile: '易碎',
  oversized: '大件',
}

export const STATUS_COLORS: Record<PackageStatus, string> = {
  arrived: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-teal-100 text-teal-800',
  notified: 'bg-indigo-100 text-indigo-800',
  verified: 'bg-emerald-100 text-emerald-800',
  problem: 'bg-amber-100 text-amber-800',
  returned: 'bg-zinc-100 text-zinc-800',
  completed: 'bg-green-100 text-green-800',
}
