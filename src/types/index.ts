export type Role = 'doctor' | 'nurse' | 'ph_specialist'

export type FollowUpStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed' | 'warned' | 'confirmed'

export type WarningLevel = 'red' | 'orange' | 'yellow'

export type WarningStatus = 'active' | 'processing' | 'resolved' | 'returned'

export type WarningActionType = 'remind' | 'confirm' | 'return' | 'assign' | 'batch_confirm' | 'batch_assign' | 'batch_return'

export interface Patient {
  id: string
  name: string
  gender: '男' | '女'
  age: number
  diseaseType: string
}

export interface Indicator {
  id: string
  followUpId: string
  name: string
  value: number
  unit: string
  normalMin: number
  normalMax: number
  recordedAt: string
  recorderRole: Role
}

export interface StatusLog {
  id: string
  followUpId: string
  fromStatus: FollowUpStatus | null
  toStatus: FollowUpStatus
  operatorRole: Role
  operatorName: string
  operatedAt: string
  remark: string
}

export interface FollowUp {
  id: string
  patientId: string
  status: FollowUpStatus
  assigneeRole: Role
  assigneeName: string
  createdAt: string
  updatedAt: string
  deadlineHours: number
  indicators: Indicator[]
  statusLogs: StatusLog[]
}

export interface Warning {
  id: string
  indicatorId: string
  followUpId: string
  level: WarningLevel
  ruleName: string
  ruleDesc: string
  status: WarningStatus
  assigneeRole: Role
  assigneeName: string
  triggeredAt: string
  actions: WarningAction[]
}

export interface WarningAction {
  id: string
  warningId: string
  actionType: WarningActionType
  operatorRole: Role
  operatorName: string
  operatedAt: string
  remark: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  createdAt: number
}

export const ROLE_LABELS: Record<Role, string> = {
  doctor: '全科医生',
  nurse: '护士',
  ph_specialist: '公共卫生专员',
}

export const STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: '待随访',
  in_progress: '随访中',
  pending_review: '待审核',
  completed: '已完成',
  warned: '已预警',
  confirmed: '已闭环',
}

export const WARNING_LEVEL_LABELS: Record<WarningLevel, string> = {
  red: '红色预警',
  orange: '橙色预警',
  yellow: '黄色预警',
}

export const WARNING_STATUS_LABELS: Record<WarningStatus, string> = {
  active: '待处理',
  processing: '处理中',
  resolved: '已解决',
  returned: '已退回',
}
