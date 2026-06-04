export type StaffRole = 'surgeon' | 'nurse' | 'anesthesiologist' | 'department_head' | 'admin'

export type ComplicationSeverity = 'mild' | 'moderate' | 'severe' | 'critical'

export type ComplicationStatus = 'pending' | 'processing' | 'pending_followup' | 'resolved' | 'closed' | 'rejected'

export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'cancelled' | 'returned'

export type AuditAction = 
  | 'report_create'
  | 'report_update'
  | 'status_change'
  | 'followup_create'
  | 'followup_update'
  | 'followup_complete'
  | 'followup_return'
  | 'followup_cancel'
  | 'note_add'
  | 'attachment_upload'
  | 'report_reject'
  | 'report_approve'

export interface Staff {
  id: string
  name: string
  role: StaffRole
  department: string
  phone: string
}

export interface Patient {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  idCard: string
  phone: string
  bedNumber: string
  roomNumber: string
}

export interface Surgery {
  id: string
  patientId: string
  patient: Patient
  surgeryName: string
  surgeryCode: string
  surgeryDate: string
  operatingRoom: string
  surgeonId: string
  surgeon: Staff
  anesthesiologistId: string
  anesthesiologist: Staff
  nurseIds: string[]
  nurses: Staff[]
  scheduledStartTime: string
  actualStartTime?: string
  actualEndTime?: string
  surgeryStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  diagnosis: string
  operationNotes?: string
}

export interface ComplicationReport {
  id: string
  reportNo: string
  patientId: string
  patient: Patient
  surgeryId?: string
  surgery?: Surgery
  reporterId: string
  reporter: Staff
  reportTime: string
  complicationType: string
  complicationCode: string
  severity: ComplicationSeverity
  onsetTime: string
  description: string
  clinicalManifestation: string
  treatmentMeasures: string
  currentStatus: string
  status: ComplicationStatus
  handlerId?: string
  handler?: Staff
  department: string
  isUrgent: boolean
  rejectReason?: string
  resolvedTime?: string
  resolution?: string
  closedTime?: string
  createdAt: string
  updatedAt: string
}

export interface FollowUpRecord {
  id: string
  reportId: string
  report: ComplicationReport
  followUpType: 'phone' | 'outpatient' | 'home' | 'inpatient'
  plannedTime: string
  actualTime?: string
  operatorId: string
  operator: Staff
  status: FollowUpStatus
  patientCondition: string
  vitalSigns?: string
  woundCondition?: string
  medicationCompliance?: string
  guidanceGiven: string
  nextFollowUpTime?: string
  notes?: string
  returnReason?: string
  returnedTime?: string
  returnedById?: string
  returnedBy?: Staff
  cancelReason?: string
  cancelledTime?: string
  cancelledById?: string
  cancelledBy?: Staff
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  reportId?: string
  followUpId?: string
  action: AuditAction
  description: string
  operatorId: string
  operatorName: string
  operatorRole: StaffRole
  oldValue?: string
  newValue?: string
  timestamp: string
  ip?: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp: string
  traceId?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  todayPending: number
  todayOverdue: number
  recentlyRejected: number
  totalProcessing: number
  todayReported: number
  todayFollowUp: number
  resolvedThisWeek: number
  averageResolutionHours: number
  followUpTodayPending: number
  followUpOverdue: number
  followUpRecentlyReturned: number
}

export const ErrorCodes = {
  SUCCESS: { code: 0, message: '操作成功' },
  PARAM_ERROR: { code: 40001, message: '参数错误' },
  UNAUTHORIZED: { code: 40101, message: '未授权' },
  FORBIDDEN: { code: 40301, message: '无权限操作' },
  NOT_FOUND: { code: 40401, message: '记录不存在' },
  REPORT_NOT_FOUND: { code: 40402, message: '并发症上报记录不存在' },
  FOLLOWUP_NOT_FOUND: { code: 40403, message: '回访记录不存在' },
  PATIENT_NOT_FOUND: { code: 40404, message: '患者信息不存在' },
  SURGERY_NOT_FOUND: { code: 40405, message: '手术记录不存在' },
  INVALID_STATUS_TRANSITION: { code: 40901, message: '无效的状态流转' },
  REPORT_ALREADY_PROCESSED: { code: 40902, message: '该上报已处理，无法重复操作' },
  FOLLOWUP_ALREADY_COMPLETED: { code: 40903, message: '该回访已完成，无法修改' },
  FOLLOWUP_RETURNED: { code: 40904, message: '该回访已退回，需重新处理' },
  FOLLOWUP_CANNOT_RETURN: { code: 40905, message: '只有已完成的回访才能退回' },
  SERVER_ERROR: { code: 50001, message: '服务器内部错误' },
  DATABASE_ERROR: { code: 50002, message: '数据库操作失败' },
} as const

export type ErrorCodeType = typeof ErrorCodes[keyof typeof ErrorCodes]
