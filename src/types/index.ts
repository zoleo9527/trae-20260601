export type Role = 'supervisor' | 'caregiver' | 'social_worker'

export type ReminderStatus = 'pending' | 'confirmed' | 'abnormal' | 'timeout'

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'supplemented'

export type AnomalyType = 'medication_refused' | 'adverse_reaction' | 'timeout' | 'other'

export type Severity = 'low' | 'medium' | 'high'

export interface MedicationReminder {
  id: string
  elderId: string
  elderName: string
  bedNo: string
  medicationName: string
  dosage: string
  scheduledTime: string
  status: ReminderStatus
  caregiverId: string
  caregiverName: string
  confirmedAt?: string
  abnormalNote?: string
  reportId?: string
}

export interface SupplementRecord {
  id: string
  reportId: string
  supplementContent: string
  supplementedBy: string
  supplementedAt: string
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
}

export interface AnomalyReport {
  id: string
  reminderId: string
  elderId: string
  elderName: string
  bedNo: string
  reporterId: string
  reporterName: string
  anomalyType: AnomalyType
  description: string
  severity: Severity
  status: ReportStatus
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  supplementHistory: SupplementRecord[]
  involvesFamily: boolean
  familyNotified: boolean
  familyConfirmed: boolean
  attachments: Attachment[]
}

export interface OperationLog {
  id: string
  entityType: 'reminder' | 'report'
  entityId: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  timestamp: string
  detail: string
}

export interface Elder {
  id: string
  name: string
  bedNo: string
  age: number
  conditions: string[]
}

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  medication_refused: '拒服药物',
  adverse_reaction: '不良反应',
  timeout: '超时未处理',
  other: '其他异常',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  abnormal: '异常上报',
  timeout: '超时',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: '草稿',
  submitted: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  supplemented: '已补录',
}

export const ROLE_LABELS: Record<Role, string> = {
  supervisor: '护理主管',
  caregiver: '责任护工',
  social_worker: '社工',
}
