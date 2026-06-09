export type ScheduleStatus = 'PENDING' | 'URGED' | 'CONFIRMED' | 'RETURNED' | 'SUPPLEMENTING' | 'IN_TREATMENT' | 'COMPLETED' | 'CANCELLED'

export type CheckinStatus = 'WAITING' | 'CHECKED_IN' | 'IN_TREATMENT' | 'COMPLETED' | 'CANCELLED'

export type AlertType = 'PLAN_DISRUPTED' | 'ASSESSMENT_NOT_FOLLOWED' | 'EQUIPMENT_CONFLICT'

export type AlertLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type UserRole = 'THERAPIST' | 'RECEPTION' | 'DIRECTOR'

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PENDING: '待确认',
  URGED: '已催促',
  CONFIRMED: '已确认',
  RETURNED: '已退回',
  SUPPLEMENTING: '补材料中',
  IN_TREATMENT: '治疗中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export const CHECKIN_STATUS_LABELS: Record<CheckinStatus, string> = {
  WAITING: '待签到',
  CHECKED_IN: '已签到',
  IN_TREATMENT: '治疗中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  PLAN_DISRUPTED: '治疗计划打乱',
  ASSESSMENT_NOT_FOLLOWED: '评估未跟进',
  EQUIPMENT_CONFLICT: '器械占用冲突',
}

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  THERAPIST: '康复治疗师',
  RECEPTION: '前台',
  DIRECTOR: '科室主任',
}
