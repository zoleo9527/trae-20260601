import { complicationTypes, mockAuditLogs, mockFollowUps, mockPatients, mockReports, mockStaff, mockSurgeries } from '@/mock/data'
import type {
    ApiResponse,
    AuditAction,
    AuditLog,
    ComplicationReport,
    ComplicationSeverity,
    ComplicationStatus,
    DashboardStats,
    FollowUpRecord,
    FollowUpStatus,
    PaginationParams, PaginationResult,
    Patient,
    Staff,
    Surgery
} from '@/types'
import { ErrorCodes as EC } from '@/types'
import dayjs from 'dayjs'
import { reactive } from 'vue'

interface State {
  reports: ComplicationReport[]
  followUps: FollowUpRecord[]
  auditLogs: AuditLog[]
  staff: Staff[]
  patients: Patient[]
  surgeries: Surgery[]
  currentUser: Staff
}

const state = reactive<State>({
  reports: JSON.parse(JSON.stringify(mockReports)),
  followUps: JSON.parse(JSON.stringify(mockFollowUps)),
  auditLogs: JSON.parse(JSON.stringify(mockAuditLogs)),
  staff: JSON.parse(JSON.stringify(mockStaff)),
  patients: JSON.parse(JSON.stringify(mockPatients)),
  surgeries: JSON.parse(JSON.stringify(mockSurgeries)),
  currentUser: JSON.parse(JSON.stringify(mockStaff[0]))
})

let idCounter = 1000
let traceCounter = 0
function nextId(prefix: string): string {
  return `${prefix}${++idCounter}`
}

function nextTraceId(): string {
  return `trace-${Date.now()}-${++traceCounter}`
}

function now(): string {
  return new Date().toISOString()
}

function generateReportNo(): string {
  const dateStr = dayjs().format('YYYY-MMDD')
  const todayCount = state.reports.filter(r => 
    dayjs(r.reportTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
  ).length + 1
  return `COMP-${dateStr}-${String(todayCount).padStart(3, '0')}`
}

function success<T>(data?: T, message: string = EC.SUCCESS.message): ApiResponse<T> {
  return {
    code: EC.SUCCESS.code,
    message,
    data,
    timestamp: now(),
    traceId: nextTraceId()
  }
}

function error(errorCode: typeof EC[keyof typeof EC], message?: string): ApiResponse {
  return {
    code: errorCode.code,
    message: message || errorCode.message,
    timestamp: now(),
    traceId: nextTraceId()
  }
}

function addAuditLog(params: {
  reportId?: string
  followUpId?: string
  action: AuditAction
  description: string
  oldValue?: string
  newValue?: string
}): void {
  state.auditLogs.unshift({
    id: nextId('a'),
    reportId: params.reportId,
    followUpId: params.followUpId,
    action: params.action,
    description: params.description,
    operatorId: state.currentUser.id,
    operatorName: state.currentUser.name,
    operatorRole: state.currentUser.role,
    oldValue: params.oldValue,
    newValue: params.newValue,
    timestamp: now()
  })
}

function isValidStatusTransition(from: ComplicationStatus, to: ComplicationStatus): boolean {
  const transitions: Record<ComplicationStatus, ComplicationStatus[]> = {
    pending: ['processing', 'rejected'],
    processing: ['pending_followup', 'resolved', 'rejected'],
    pending_followup: ['processing', 'resolved', 'rejected'],
    resolved: ['closed', 'processing'],
    closed: [],
    rejected: ['pending', 'processing']
  }
  return transitions[from]?.includes(to) ?? false
}

export function getComplicationTypes() {
  return success(complicationTypes)
}

export function getStaffList() {
  return success(state.staff)
}

export function getPatientList() {
  return success(state.patients)
}

export function getSurgeryList() {
  return success(state.surgeries)
}

export function getSurgeryById(id: string) {
  const surgery = state.surgeries.find(s => s.id === id)
  if (!surgery) return error(EC.SURGERY_NOT_FOUND)
  return success(surgery)
}

export function getPatientById(id: string) {
  const patient = state.patients.find(p => p.id === id)
  if (!patient) return error(EC.PATIENT_NOT_FOUND)
  return success(patient)
}

export interface CreateReportParams {
  patientId: string
  surgeryId?: string
  complicationType: string
  complicationCode: string
  severity: ComplicationSeverity
  onsetTime: string
  description: string
  clinicalManifestation: string
  treatmentMeasures: string
  currentStatus: string
  isUrgent: boolean
  department: string
}

export function createReport(params: CreateReportParams): ApiResponse<ComplicationReport> {
  if (!params.patientId || !params.complicationType || !params.description) {
    return error(EC.PARAM_ERROR, '患者ID、并发症类型和描述不能为空')
  }

  const patient = state.patients.find(p => p.id === params.patientId)
  if (!patient) return error(EC.PATIENT_NOT_FOUND)

  let surgery: Surgery | undefined
  if (params.surgeryId) {
    surgery = state.surgeries.find(s => s.id === params.surgeryId)
    if (!surgery) return error(EC.SURGERY_NOT_FOUND)
  }

  const reportNo = generateReportNo()
  const newReport: ComplicationReport = {
    id: nextId('r'),
    reportNo,
    patientId: params.patientId,
    patient,
    surgeryId: params.surgeryId,
    surgery,
    reporterId: state.currentUser.id,
    reporter: state.currentUser,
    reportTime: now(),
    complicationType: params.complicationType,
    complicationCode: params.complicationCode,
    severity: params.severity,
    onsetTime: params.onsetTime,
    description: params.description,
    clinicalManifestation: params.clinicalManifestation,
    treatmentMeasures: params.treatmentMeasures,
    currentStatus: params.currentStatus,
    status: 'pending',
    department: params.department,
    isUrgent: params.isUrgent,
    createdAt: now(),
    updatedAt: now()
  }

  state.reports.unshift(newReport)

  addAuditLog({
    reportId: newReport.id,
    action: 'report_create',
    description: `${state.currentUser.name}提交了并发症上报：${params.complicationType}`
  })

  return success(newReport, '上报成功')
}

export interface UpdateReportParams {
  id: string
  description?: string
  clinicalManifestation?: string
  treatmentMeasures?: string
  currentStatus?: string
}

export function updateReport(params: UpdateReportParams): ApiResponse<ComplicationReport> {
  const report = state.reports.find(r => r.id === params.id)
  if (!report) return error(EC.REPORT_NOT_FOUND)

  if (report.status === 'closed') {
    return error(EC.REPORT_ALREADY_PROCESSED, '已结案的上报无法修改')
  }

  const changes: string[] = []
  if (params.description !== undefined && params.description !== report.description) {
    changes.push(`描述`)
    report.description = params.description
  }
  if (params.clinicalManifestation !== undefined && params.clinicalManifestation !== report.clinicalManifestation) {
    changes.push(`临床表现`)
    report.clinicalManifestation = params.clinicalManifestation
  }
  if (params.treatmentMeasures !== undefined && params.treatmentMeasures !== report.treatmentMeasures) {
    changes.push(`处理措施`)
    report.treatmentMeasures = params.treatmentMeasures
  }
  if (params.currentStatus !== undefined && params.currentStatus !== report.currentStatus) {
    changes.push(`当前状态描述`)
    report.currentStatus = params.currentStatus
  }
  report.updatedAt = now()

  if (changes.length > 0) {
    addAuditLog({
      reportId: report.id,
      action: 'report_update',
      description: `${state.currentUser.name}更新了上报信息：${changes.join('、')}`,
      oldValue: changes.join(','),
      newValue: 'updated'
    })
  }

  return success(report, '更新成功')
}

export interface ChangeStatusParams {
  id: string
  status: ComplicationStatus
  handlerId?: string
  resolution?: string
  rejectReason?: string
}

export function changeStatus(params: ChangeStatusParams): ApiResponse<ComplicationReport> {
  const report = state.reports.find(r => r.id === params.id)
  if (!report) return error(EC.REPORT_NOT_FOUND)

  if (report.status === 'closed') {
    return error(EC.REPORT_ALREADY_PROCESSED, '已结案的上报无法变更状态')
  }

  if (!isValidStatusTransition(report.status, params.status)) {
    return error(EC.INVALID_STATUS_TRANSITION, 
      `无法从状态"${statusMap[report.status].label}"流转到"${statusMap[params.status].label}"`)
  }

  if (params.status === 'processing' && !report.handlerId && !params.handlerId) {
    return error(EC.PARAM_ERROR, '受理上报时必须指定处理人')
  }

  if (params.status === 'rejected' && !params.rejectReason) {
    return error(EC.PARAM_ERROR, '驳回时必须填写驳回原因')
  }

  if ((params.status === 'resolved' || params.status === 'closed') && !params.resolution) {
    return error(EC.PARAM_ERROR, '解决或结案时必须填写处理结果')
  }

  const oldStatus = report.status
  report.status = params.status
  report.updatedAt = now()

  if (params.handlerId) {
    const handler = state.staff.find(s => s.id === params.handlerId)
    if (handler) {
      report.handlerId = params.handlerId
      report.handler = handler
    }
  }

  if (params.status === 'rejected' && params.rejectReason) {
    report.rejectReason = params.rejectReason
  }

  if (params.status === 'resolved') {
    report.resolvedTime = now()
    report.resolution = params.resolution
  }

  if (params.status === 'closed') {
    report.closedTime = now()
    if (params.resolution) report.resolution = params.resolution
  }

  const statusLabel = statusMap[params.status].label
  const oldStatusLabel = statusMap[oldStatus].label
  addAuditLog({
    reportId: report.id,
    action: 'status_change',
    description: `${state.currentUser.name}将上报状态从"${oldStatusLabel}"改为"${statusLabel}"`,
    oldValue: oldStatus,
    newValue: params.status
  })

  if (params.status === 'rejected') {
    addAuditLog({
      reportId: report.id,
      action: 'report_reject',
      description: `驳回原因：${params.rejectReason}`
    })
  }

  if (params.status === 'resolved') {
    addAuditLog({
      reportId: report.id,
      action: 'report_approve',
      description: `处理结果：${params.resolution}`
    })
  }

  return success(report, `状态已更新为${statusLabel}`)
}

export function getReportById(id: string): ApiResponse<ComplicationReport> {
  const report = state.reports.find(r => r.id === id)
  if (!report) return error(EC.REPORT_NOT_FOUND)
  return success(report)
}

export interface QueryReportParams extends PaginationParams {
  status?: ComplicationStatus
  severity?: ComplicationSeverity
  keyword?: string
  patientName?: string
  startDate?: string
  endDate?: string
  isUrgent?: boolean
}

export function queryReports(params: QueryReportParams): ApiResponse<PaginationResult<ComplicationReport>> {
  let filtered = [...state.reports]

  if (params.status) {
    filtered = filtered.filter(r => r.status === params.status)
  }
  if (params.severity) {
    filtered = filtered.filter(r => r.severity === params.severity)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(r => 
      r.patient.name.toLowerCase().includes(kw) ||
      r.complicationType.toLowerCase().includes(kw) ||
      r.reportNo.toLowerCase().includes(kw)
    )
  }
  if (params.patientName) {
    filtered = filtered.filter(r => r.patient.name.includes(params.patientName!))
  }
  if (params.startDate) {
    filtered = filtered.filter(r => dayjs(r.reportTime) >= dayjs(params.startDate))
  }
  if (params.endDate) {
    filtered = filtered.filter(r => dayjs(r.reportTime) <= dayjs(params.endDate).endOf('day'))
  }
  if (params.isUrgent !== undefined) {
    filtered = filtered.filter(r => r.isUrgent === params.isUrgent)
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const list = filtered.slice(start, start + params.pageSize)

  return success({
    list,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize)
  })
}

export function getTodayPending(): ApiResponse<ComplicationReport[]> {
  const pending = state.reports.filter(r => 
    r.status === 'pending' || r.status === 'rejected'
  )
  pending.sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
    const severityOrder: Record<ComplicationSeverity, number> = { critical: 0, severe: 1, moderate: 2, mild: 3 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) return severityOrder[a.severity] - severityOrder[b.severity]
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
  return success(pending)
}

export function getOverdueReports(): ApiResponse<ComplicationReport[]> {
  const nowTime = dayjs()
  const overdue = state.reports.filter(r => {
    if (r.status === 'resolved' || r.status === 'closed') return false
    const hoursPassed = nowTime.diff(dayjs(r.reportTime), 'hour')
    if (r.isUrgent && hoursPassed > 2) return true
    if (r.severity === 'critical' && hoursPassed > 4) return true
    if (r.severity === 'severe' && hoursPassed > 8) return true
    if (r.severity === 'moderate' && hoursPassed > 24) return true
    if (r.severity === 'mild' && hoursPassed > 48) return true
    return false
  })
  overdue.sort((a, b) => {
    const hoursA = nowTime.diff(dayjs(a.reportTime), 'hour')
    const hoursB = nowTime.diff(dayjs(b.reportTime), 'hour')
    const limitA = getOverdueLimit(a)
    const limitB = getOverdueLimit(b)
    return (hoursA - limitA) - (hoursB - limitB)
  })
  return success(overdue)
}

function getOverdueLimit(report: ComplicationReport): number {
  if (report.isUrgent) return 2
  switch (report.severity) {
    case 'critical': return 4
    case 'severe': return 8
    case 'moderate': return 24
    case 'mild': return 48
  }
}

export function getRecentlyRejected(): ApiResponse<ComplicationReport[]> {
  const oneDayAgo = dayjs().subtract(24, 'hour')
  const rejected = state.reports
    .filter(r => r.status === 'rejected' && dayjs(r.updatedAt) >= oneDayAgo)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return success(rejected)
}

export function getDashboardStats(): ApiResponse<DashboardStats> {
  const today = dayjs().format('YYYY-MM-DD')
  const weekAgo = dayjs().subtract(7, 'day')
  
  const todayPending = state.reports.filter(r => 
    r.status === 'pending' || r.status === 'rejected'
  ).length

  let todayOverdue = 0
  const nowTime = dayjs()
  state.reports.forEach(r => {
    if (r.status === 'resolved' || r.status === 'closed') return
    const hoursPassed = nowTime.diff(dayjs(r.reportTime), 'hour')
    if (r.isUrgent && hoursPassed > 2) todayOverdue++
    else if (r.severity === 'critical' && hoursPassed > 4) todayOverdue++
    else if (r.severity === 'severe' && hoursPassed > 8) todayOverdue++
    else if (r.severity === 'moderate' && hoursPassed > 24) todayOverdue++
    else if (r.severity === 'mild' && hoursPassed > 48) todayOverdue++
  })

  const oneDayAgo = dayjs().subtract(24, 'hour')
  const recentlyRejected = state.reports.filter(r => 
    r.status === 'rejected' && dayjs(r.updatedAt) >= oneDayAgo
  ).length

  const totalProcessing = state.reports.filter(r => 
    r.status === 'processing' || r.status === 'pending_followup'
  ).length

  const todayReported = state.reports.filter(r => 
    dayjs(r.createdAt).format('YYYY-MM-DD') === today
  ).length

  const todayFollowUp = state.followUps.filter(f => 
    f.status === 'pending' && dayjs(f.plannedTime).format('YYYY-MM-DD') === today
  ).length

  const resolvedThisWeek = state.reports.filter(r => 
    r.status === 'resolved' && r.resolvedTime && dayjs(r.resolvedTime) >= weekAgo
  ).length

  const resolvedReports = state.reports.filter(r => r.resolvedTime)
  const averageResolutionHours = resolvedReports.length > 0
    ? Math.round(resolvedReports.reduce((sum, r) => {
        const hours = dayjs(r.resolvedTime!).diff(dayjs(r.createdAt), 'hour')
        return sum + hours
      }, 0) / resolvedReports.length)
    : 0

  const nowTime2 = dayjs()
  const oneDayAgo2 = dayjs().subtract(24, 'hour')

  const followUpTodayPending = state.followUps.filter(f =>
    (f.status === 'pending' || f.status === 'returned') &&
    dayjs(f.plannedTime).format('YYYY-MM-DD') === today
  ).length

  const followUpOverdue = state.followUps.filter(f =>
    (f.status === 'pending' || f.status === 'returned') &&
    nowTime2.isAfter(dayjs(f.plannedTime))
  ).length

  const followUpRecentlyReturned = state.followUps.filter(f =>
    f.status === 'returned' && f.returnedTime && dayjs(f.returnedTime) >= oneDayAgo2
  ).length

  return success({
    todayPending,
    todayOverdue,
    recentlyRejected,
    totalProcessing,
    todayReported,
    todayFollowUp,
    resolvedThisWeek,
    averageResolutionHours,
    followUpTodayPending,
    followUpOverdue,
    followUpRecentlyReturned
  })
}

export interface CreateFollowUpParams {
  reportId: string
  followUpType: 'phone' | 'outpatient' | 'home' | 'inpatient'
  plannedTime: string
}

export function createFollowUp(params: CreateFollowUpParams): ApiResponse<FollowUpRecord> {
  if (!params.reportId || !params.followUpType || !params.plannedTime) {
    return error(EC.PARAM_ERROR, '上报ID、回访类型和计划时间不能为空')
  }

  const report = state.reports.find(r => r.id === params.reportId)
  if (!report) return error(EC.REPORT_NOT_FOUND)

  if (report.status !== 'processing' && report.status !== 'pending_followup') {
    return error(EC.INVALID_STATUS_TRANSITION, '只有在"处理中"或"待回访"状态下才能创建回访计划')
  }

  const newFollowUp: FollowUpRecord = {
    id: nextId('f'),
    reportId: params.reportId,
    report,
    followUpType: params.followUpType,
    plannedTime: params.plannedTime,
    operatorId: state.currentUser.id,
    operator: state.currentUser,
    status: 'pending',
    patientCondition: '',
    guidanceGiven: '',
    createdAt: now(),
    updatedAt: now()
  }

  state.followUps.unshift(newFollowUp)

  const oldStatus = report.status
  if (report.status === 'processing') {
    report.status = 'pending_followup'
    report.updatedAt = now()

    addAuditLog({
      reportId: params.reportId,
      action: 'status_change',
      description: `${state.currentUser.name}创建回访计划，上报状态从"${statusMap[oldStatus].label}"自动变更为"${statusMap['pending_followup'].label}"`,
      oldValue: oldStatus,
      newValue: 'pending_followup'
    })
  }

  addAuditLog({
    reportId: params.reportId,
    followUpId: newFollowUp.id,
    action: 'followup_create',
    description: `${state.currentUser.name}创建了${followUpTypeMap[params.followUpType].label}回访计划，计划时间${dayjs(params.plannedTime).format('YYYY-MM-DD HH:mm')}`
  })

  return success(newFollowUp, '回访计划创建成功')
}

export interface CompleteFollowUpParams {
  id: string
  patientCondition: string
  vitalSigns?: string
  woundCondition?: string
  medicationCompliance?: string
  guidanceGiven: string
  nextFollowUpTime?: string
  notes?: string
}

export function completeFollowUp(params: CompleteFollowUpParams): ApiResponse<FollowUpRecord> {
  const followUp = state.followUps.find(f => f.id === params.id)
  if (!followUp) return error(EC.FOLLOWUP_NOT_FOUND)

  if (followUp.status !== 'pending' && followUp.status !== 'returned') {
    return error(EC.FOLLOWUP_ALREADY_COMPLETED, `该回访当前状态为"${followUpStatusMap[followUp.status].label}"，无法完成`)
  }

  if (!params.patientCondition || !params.guidanceGiven) {
    return error(EC.PARAM_ERROR, '患者情况和指导意见不能为空')
  }

  const oldStatus = followUp.status

  followUp.status = 'completed'
  followUp.actualTime = now()
  followUp.patientCondition = params.patientCondition
  followUp.vitalSigns = params.vitalSigns
  followUp.woundCondition = params.woundCondition
  followUp.medicationCompliance = params.medicationCompliance
  followUp.guidanceGiven = params.guidanceGiven
  followUp.nextFollowUpTime = params.nextFollowUpTime
  followUp.notes = params.notes
  followUp.updatedAt = now()
  addAuditLog({
    reportId: followUp.reportId,
    followUpId: followUp.id,
    action: 'followup_complete',
    description: `${state.currentUser.name}完成了${followUpTypeMap[followUp.followUpType].label}回访记录`,
    oldValue: oldStatus,
    newValue: 'completed'
  })

  if (params.nextFollowUpTime) {
    addAuditLog({
      reportId: followUp.reportId,
      followUpId: followUp.id,
      action: 'followup_create',
      description: `${state.currentUser.name}安排了下一次回访，计划时间${dayjs(params.nextFollowUpTime).format('YYYY-MM-DD HH:mm')}`
    })
  }

  return success(followUp, '回访记录已保存')
}

export interface CancelFollowUpParams {
  id: string
  reason: string
}

export function cancelFollowUp(params: CancelFollowUpParams): ApiResponse<FollowUpRecord> {
  const followUp = state.followUps.find(f => f.id === params.id)
  if (!followUp) return error(EC.FOLLOWUP_NOT_FOUND)

  if (followUp.status !== 'pending' && followUp.status !== 'returned') {
    return error(EC.FOLLOWUP_ALREADY_COMPLETED, `该回访当前状态为"${followUpStatusMap[followUp.status].label}"，无法取消`)
  }

  if (!params.reason) {
    return error(EC.PARAM_ERROR, '取消原因不能为空')
  }

  const oldStatus = followUp.status

  followUp.status = 'cancelled'
  followUp.notes = (followUp.notes || '') + ` [取消原因：${params.reason}]`
  followUp.updatedAt = now()

  addAuditLog({
    reportId: followUp.reportId,
    followUpId: followUp.id,
    action: 'followup_cancel',
    description: `${state.currentUser.name}取消了回访计划，原因：${params.reason}`,
    oldValue: oldStatus,
    newValue: 'cancelled'
  })

  return success(followUp, '回访已取消')
}

export interface ReturnFollowUpParams {
  id: string
  reason: string
}

export function returnFollowUp(params: ReturnFollowUpParams): ApiResponse<FollowUpRecord> {
  const followUp = state.followUps.find(f => f.id === params.id)
  if (!followUp) return error(EC.FOLLOWUP_NOT_FOUND)

  if (followUp.status !== 'completed') {
    return error(EC.FOLLOWUP_CANNOT_RETURN, `只有已完成的回访才能退回，当前状态为"${followUpStatusMap[followUp.status].label}"`)
  }

  if (!params.reason) {
    return error(EC.PARAM_ERROR, '退回原因不能为空')
  }

  const oldStatus = followUp.status
  followUp.status = 'returned'
  followUp.returnReason = params.reason
  followUp.returnedTime = now()
  followUp.returnedById = state.currentUser.id
  followUp.returnedBy = state.currentUser
  followUp.updatedAt = now()

  addAuditLog({
    reportId: followUp.reportId,
    followUpId: followUp.id,
    action: 'followup_return',
    description: `${state.currentUser.name}退回了${followUpTypeMap[followUp.followUpType].label}回访记录，原因：${params.reason}`,
    oldValue: oldStatus,
    newValue: 'returned'
  })

  return success(followUp, '回访已退回，需重新处理')
}

export interface AddNoteParams {
  reportId: string
  content: string
}

export function addNote(params: AddNoteParams): ApiResponse<ComplicationReport> {
  const report = state.reports.find(r => r.id === params.reportId)
  if (!report) return error(EC.REPORT_NOT_FOUND)

  if (!params.content) {
    return error(EC.PARAM_ERROR, '备注内容不能为空')
  }

  addAuditLog({
    reportId: params.reportId,
    action: 'note_add',
    description: `${state.currentUser.name}添加了备注：${params.content}`
  })

  return success(report, '备注已添加')
}

export function getFollowUpById(id: string): ApiResponse<FollowUpRecord> {
  const followUp = state.followUps.find(f => f.id === id)
  if (!followUp) return error(EC.FOLLOWUP_NOT_FOUND)
  return success(followUp)
}

export function getFollowUpsByReportId(reportId: string): ApiResponse<FollowUpRecord[]> {
  const followUps = state.followUps
    .filter(f => f.reportId === reportId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return success(followUps)
}

export interface QueryFollowUpParams extends PaginationParams {
  status?: FollowUpStatus
  followUpType?: string
}

export function getAllFollowUps(params?: QueryFollowUpParams): ApiResponse<PaginationResult<FollowUpRecord>> {
  let filtered = [...state.followUps]

  if (params?.status) {
    filtered = filtered.filter(f => f.status === params.status)
  }
  if (params?.followUpType) {
    filtered = filtered.filter(f => f.followUpType === params.followUpType)
  }

  filtered.sort((a, b) => new Date(b.plannedTime).getTime() - new Date(a.plannedTime).getTime())

  if (params) {
    const total = filtered.length
    const start = (params.page - 1) * params.pageSize
    const list = filtered.slice(start, start + params.pageSize)
    return success({
      list,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize)
    })
  }

  return success({
    list: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length,
    totalPages: 1
  })
}

export function getAuditLogsByReportId(reportId: string): ApiResponse<AuditLog[]> {
  const logs = state.auditLogs
    .filter(l => l.reportId === reportId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return success(logs)
}

export function getAuditLogsByFollowUpId(followUpId: string): ApiResponse<AuditLog[]> {
  const logs = state.auditLogs
    .filter(l => l.followUpId === followUpId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return success(logs)
}

export function getTodayPendingFollowUps(): ApiResponse<FollowUpRecord[]> {
  const today = dayjs().format('YYYY-MM-DD')
  const pending = state.followUps.filter(f =>
    (f.status === 'pending' || f.status === 'returned') &&
    dayjs(f.plannedTime).format('YYYY-MM-DD') === today
  )
  pending.sort((a, b) => {
    if (a.status === 'returned' && b.status !== 'returned') return -1
    if (a.status !== 'returned' && b.status === 'returned') return 1
    return new Date(a.plannedTime).getTime() - new Date(b.plannedTime).getTime()
  })
  return success(pending)
}

export function getOverdueFollowUps(): ApiResponse<FollowUpRecord[]> {
  const nowTime = dayjs()
  const overdue = state.followUps.filter(f => {
    if (f.status !== 'pending' && f.status !== 'returned') return false
    return nowTime.isAfter(dayjs(f.plannedTime))
  })
  overdue.sort((a, b) => {
    const overdueA = nowTime.diff(dayjs(a.plannedTime), 'hour')
    const overdueB = nowTime.diff(dayjs(b.plannedTime), 'hour')
    return overdueB - overdueA
  })
  return success(overdue)
}

export function getRecentlyReturnedFollowUps(): ApiResponse<FollowUpRecord[]> {
  const oneDayAgo = dayjs().subtract(24, 'hour')
  const returned = state.followUps
    .filter(f => f.status === 'returned' && f.returnedTime && dayjs(f.returnedTime) >= oneDayAgo)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return success(returned)
}

export function getFollowUpDashboardStats(): ApiResponse<{ todayPending: number; overdue: number; recentlyReturned: number }> {
  const today = dayjs().format('YYYY-MM-DD')
  const nowTime = dayjs()
  const oneDayAgo = dayjs().subtract(24, 'hour')

  const todayPending = state.followUps.filter(f =>
    (f.status === 'pending' || f.status === 'returned') &&
    dayjs(f.plannedTime).format('YYYY-MM-DD') === today
  ).length

  const overdue = state.followUps.filter(f =>
    (f.status === 'pending' || f.status === 'returned') &&
    nowTime.isAfter(dayjs(f.plannedTime))
  ).length

  const recentlyReturned = state.followUps.filter(f =>
    f.status === 'returned' && f.returnedTime && dayjs(f.returnedTime) >= oneDayAgo
  ).length

  return success({ todayPending, overdue, recentlyReturned })
}

export const statusMap: Record<ComplicationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#ef4444', bgColor: '#fee2e2' },
  processing: { label: '处理中', color: '#f59e0b', bgColor: '#fef3c7' },
  pending_followup: { label: '待回访', color: '#8b5cf6', bgColor: '#ede9fe' },
  resolved: { label: '已解决', color: '#10b981', bgColor: '#d1fae5' },
  closed: { label: '已结案', color: '#6b7280', bgColor: '#f3f4f6' },
  rejected: { label: '已驳回', color: '#dc2626', bgColor: '#fecaca' }
}

export const severityMap: Record<ComplicationSeverity, { label: string; color: string; bgColor: string }> = {
  mild: { label: '轻度', color: '#10b981', bgColor: '#d1fae5' },
  moderate: { label: '中度', color: '#f59e0b', bgColor: '#fef3c7' },
  severe: { label: '重度', color: '#f97316', bgColor: '#ffedd5' },
  critical: { label: '危重', color: '#ef4444', bgColor: '#fee2e2' }
}

export const followUpStatusMap: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待回访', color: '#f59e0b', bgColor: '#fef3c7' },
  completed: { label: '已完成', color: '#10b981', bgColor: '#d1fae5' },
  missed: { label: '已错过', color: '#ef4444', bgColor: '#fee2e2' },
  cancelled: { label: '已取消', color: '#6b7280', bgColor: '#f3f4f6' },
  returned: { label: '已退回', color: '#dc2626', bgColor: '#fecaca' }
}

export const followUpTypeMap: Record<string, { label: string; color: string }> = {
  phone: { label: '电话', color: '#3b82f6' },
  outpatient: { label: '门诊', color: '#10b981' },
  home: { label: '上门', color: '#8b5cf6' },
  inpatient: { label: '住院', color: '#f59e0b' }
}

export const staffRoleMap: Record<string, { label: string; color: string }> = {
  surgeon: { label: '主刀医生', color: '#3b82f6' },
  nurse: { label: '护士', color: '#10b981' },
  anesthesiologist: { label: '麻醉师', color: '#8b5cf6' },
  department_head: { label: '科室主任', color: '#f59e0b' },
  admin: { label: '管理员', color: '#6b7280' }
}

export const auditActionMap: Record<AuditAction, { label: string; icon: string; color: string }> = {
  report_create: { label: '创建上报', icon: '📝', color: '#3b82f6' },
  report_update: { label: '更新上报', icon: '✏️', color: '#6b7280' },
  status_change: { label: '状态变更', icon: '🔄', color: '#f59e0b' },
  followup_create: { label: '创建回访', icon: '📞', color: '#8b5cf6' },
  followup_update: { label: '更新回访', icon: '📋', color: '#10b981' },
  followup_complete: { label: '完成回访', icon: '✅', color: '#059669' },
  followup_return: { label: '退回回访', icon: '↩️', color: '#dc2626' },
  followup_cancel: { label: '取消回访', icon: '🚫', color: '#6b7280' },
  note_add: { label: '添加备注', icon: '💬', color: '#6366f1' },
  attachment_upload: { label: '上传附件', icon: '📎', color: '#06b6d4' },
  report_reject: { label: '驳回上报', icon: '❌', color: '#ef4444' },
  report_approve: { label: '通过上报', icon: '✅', color: '#10b981' }
}

export function setCurrentUser(user: Staff) {
  state.currentUser = user
}

export function getCurrentUser() {
  return success(state.currentUser)
}
