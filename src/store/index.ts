import { MOCK_LOGS, MOCK_REMINDERS, MOCK_REPORTS } from '@/mock/data'
import type {
    AnomalyReport,
    AnomalyType,
    Attachment,
    MedicationReminder,
    OperationLog,
    ReminderStatus,
    ReportStatus,
    Role,
    SupplementRecord
} from '@/types'
import { create } from 'zustand'

interface AppState {
  currentRole: Role | null
  reminders: MedicationReminder[]
  reports: AnomalyReport[]
  logs: OperationLog[]
  timeoutCheckInterval: number | null

  setRole: (role: Role) => void
  clearRole: () => void

  confirmReminder: (reminderId: string) => void
  markReminderAbnormal: (reminderId: string, note: string, anomalyType: AnomalyType) => string
  markReminderTimeout: (reminderId: string) => string
  checkAndMarkTimeouts: () => string[]

  createReportDraft: (reminderId: string, anomalyType: AnomalyType) => string
  submitReport: (reportId: string) => void
  approveReport: (reportId: string) => void
  rejectReport: (reportId: string, reason: string) => void
  supplementReport: (reportId: string, content: string) => void
  resubmitReport: (reportId: string) => void
  updateReportField: (reportId: string, field: Partial<AnomalyReport>) => void
  markFamilyNotified: (reportId: string) => void
  markFamilyConfirmed: (reportId: string) => void

  addAttachment: (reportId: string, attachment: Attachment) => void
  removeAttachment: (reportId: string, attachmentId: string) => void

  startTimeoutChecker: () => void
  stopTimeoutChecker: () => void

  getLogsForEntity: (entityId: string) => OperationLog[]
  getReportForReminder: (reminderId: string) => AnomalyReport | undefined
}

const now = () => new Date().toISOString()

let nextReminderId = 100
let nextReportId = 100
let nextLogId = 100
let nextSupplementId = 100

const addLog = (
  logs: OperationLog[],
  entityType: 'reminder' | 'report',
  entityId: string,
  action: string,
  operatorId: string,
  operatorName: string,
  operatorRole: Role,
  detail: string,
): OperationLog[] => {
  const log: OperationLog = {
    id: `L${String(nextLogId++).padStart(3, '0')}`,
    entityType,
    entityId,
    action,
    operatorId,
    operatorName,
    operatorRole,
    timestamp: now(),
    detail,
  }
  return [...logs, log]
}

const ROLE_OPERATOR: Record<Role, { id: string; name: string }> = {
  supervisor: { id: 'SV001', name: '陈主管' },
  caregiver: { id: 'CG001', name: '李小燕' },
  social_worker: { id: 'SW001', name: '赵社工' },
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: null,
  reminders: [...MOCK_REMINDERS],
  reports: [...MOCK_REPORTS],
  logs: [...MOCK_LOGS],
  timeoutCheckInterval: null,

  setRole: (role) => set({ currentRole: role }),
  clearRole: () => set({ currentRole: null }),

  checkAndMarkTimeouts: () => {
    const state = get()
    const nowTime = new Date()
    const timeoutReportIds: string[] = []

    state.reminders.forEach((reminder) => {
      if (reminder.status === 'pending') {
        const scheduled = new Date(reminder.scheduledTime)
        const diffMinutes = (nowTime.getTime() - scheduled.getTime()) / (1000 * 60)
        if (diffMinutes > 30) {
          const reportId = state.markReminderTimeout(reminder.id)
          if (reportId) timeoutReportIds.push(reportId)
        }
      }
    })

    return timeoutReportIds
  },

  startTimeoutChecker: () => {
    const state = get()
    if (state.timeoutCheckInterval) return

    const intervalId = window.setInterval(() => {
      get().checkAndMarkTimeouts()
    }, 60000)

    set({ timeoutCheckInterval: intervalId })
    get().checkAndMarkTimeouts()
  },

  stopTimeoutChecker: () => {
    const state = get()
    if (state.timeoutCheckInterval) {
      clearInterval(state.timeoutCheckInterval)
      set({ timeoutCheckInterval: null })
    }
  },

  confirmReminder: (reminderId) => {
    set((state) => {
      const reminder = state.reminders.find((r) => r.id === reminderId)
      if (!reminder || reminder.status !== 'pending') return state

      const updatedReminders = state.reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'confirmed' as ReminderStatus, confirmedAt: now() }
          : r,
      )

      const op = ROLE_OPERATOR.caregiver
      const updatedLogs = addLog(
        state.logs,
        'reminder',
        reminderId,
        'confirm',
        op.id,
        op.name,
        'caregiver',
        `确认服药：${reminder.medicationName} ${reminder.dosage}`,
      )

      return { reminders: updatedReminders, logs: updatedLogs }
    })
  },

  markReminderAbnormal: (reminderId, note, anomalyType) => {
    let newReportId = ''
    set((state) => {
      const reminder = state.reminders.find((r) => r.id === reminderId)
      if (!reminder || (reminder.status !== 'pending' && reminder.status !== 'timeout'))
        return state

      const reportId = `AR${String(nextReportId++).padStart(3, '0')}`
      newReportId = reportId

      const newReport: AnomalyReport = {
        id: reportId,
        reminderId,
        elderId: reminder.elderId,
        elderName: reminder.elderName,
        bedNo: reminder.bedNo,
        reporterId: reminder.caregiverId,
        reporterName: reminder.caregiverName,
        anomalyType,
        description: note,
        severity: anomalyType === 'adverse_reaction' || anomalyType === 'timeout' ? 'high' : 'medium',
        status: 'draft',
        supplementHistory: [],
        involvesFamily: anomalyType === 'timeout' || anomalyType === 'adverse_reaction',
        familyNotified: false,
        familyConfirmed: false,
        attachments: [],
      }

      const updatedReminders = state.reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'abnormal' as ReminderStatus, abnormalNote: note, reportId }
          : r,
      )

      const op = ROLE_OPERATOR.caregiver
      const updatedLogs = addLog(
        addLog(
          state.logs,
          'reminder',
          reminderId,
          'mark_abnormal',
          op.id,
          op.name,
          'caregiver',
          `标记异常：${note}`,
        ),
        'report',
        reportId,
        'create_draft',
        op.id,
        op.name,
        'caregiver',
        `创建异常上报草稿（关联提醒 ${reminderId}）`,
      )

      return {
        reminders: updatedReminders,
        reports: [...state.reports, newReport],
        logs: updatedLogs,
      }
    })
    return newReportId
  },

  markReminderTimeout: (reminderId) => {
    let newReportId = ''
    set((state) => {
      const reminder = state.reminders.find((r) => r.id === reminderId)
      if (!reminder || reminder.status !== 'pending') return state

      const reportId = `AR${String(nextReportId++).padStart(3, '0')}`
      newReportId = reportId

      const newReport: AnomalyReport = {
        id: reportId,
        reminderId,
        elderId: reminder.elderId,
        elderName: reminder.elderName,
        bedNo: reminder.bedNo,
        reporterId: reminder.caregiverId,
        reporterName: reminder.caregiverName,
        anomalyType: 'timeout',
        description: `服药提醒超时未处理：${reminder.medicationName} ${reminder.dosage}`,
        severity: 'high',
        status: 'draft',
        supplementHistory: [],
        involvesFamily: true,
        familyNotified: false,
        familyConfirmed: false,
        attachments: [],
      }

      const updatedReminders = state.reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'timeout' as ReminderStatus, reportId }
          : r,
      )

      const updatedLogs = addLog(
        state.logs,
        'reminder',
        reminderId,
        'timeout',
        'SYSTEM',
        '系统',
        'supervisor',
        `超时未处理，自动标记异常并创建上报草稿`,
      )

      return {
        reminders: updatedReminders,
        reports: [...state.reports, newReport],
        logs: updatedLogs,
      }
    })
    return newReportId
  },

  createReportDraft: (reminderId, anomalyType) => {
    let newReportId = ''
    set((state) => {
      const reminder = state.reminders.find((r) => r.id === reminderId)
      if (!reminder) return state

      const reportId = `AR${String(nextReportId++).padStart(3, '0')}`
      newReportId = reportId

      const newReport: AnomalyReport = {
        id: reportId,
        reminderId,
        elderId: reminder.elderId,
        elderName: reminder.elderName,
        bedNo: reminder.bedNo,
        reporterId: reminder.caregiverId,
        reporterName: reminder.caregiverName,
        anomalyType,
        description: reminder.abnormalNote || '',
        severity: 'medium',
        status: 'draft',
        supplementHistory: [],
        involvesFamily: false,
        familyNotified: false,
        familyConfirmed: false,
        attachments: [],
      }

      const updatedReminders = state.reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'abnormal' as ReminderStatus, reportId }
          : r,
      )

      return {
        reminders: updatedReminders,
        reports: [...state.reports, newReport],
      }
    })
    return newReportId
  },

  submitReport: (reportId) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      if (!report) return state

      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? { ...r, status: 'submitted' as ReportStatus, submittedAt: now() }
          : r,
      )

      const op = ROLE_OPERATOR.caregiver
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'submit',
        op.id,
        op.name,
        'caregiver',
        `提交异常上报：${report.description.slice(0, 30)}...`,
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  approveReport: (reportId) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      if (!report) return state

      const op = ROLE_OPERATOR.supervisor
      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'approved' as ReportStatus,
              reviewedBy: op.id,
              reviewedAt: now(),
            }
          : r,
      )

      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'approve',
        op.id,
        op.name,
        'supervisor',
        '审批通过',
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  rejectReport: (reportId, reason) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      if (!report) return state

      const op = ROLE_OPERATOR.supervisor
      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'rejected' as ReportStatus,
              rejectionReason: reason,
              reviewedBy: op.id,
              reviewedAt: now(),
            }
          : r,
      )

      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'reject',
        op.id,
        op.name,
        'supervisor',
        `驳回原因：${reason}`,
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  supplementReport: (reportId, content) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      if (!report) return state

      const supplement: SupplementRecord = {
        id: `S${String(nextSupplementId++).padStart(3, '0')}`,
        reportId,
        supplementContent: content,
        supplementedBy: ROLE_OPERATOR.caregiver.id,
        supplementedAt: now(),
      }

      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'supplemented' as ReportStatus,
              supplementHistory: [...r.supplementHistory, supplement],
            }
          : r,
      )

      const op = ROLE_OPERATOR.caregiver
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'supplement',
        op.id,
        op.name,
        'caregiver',
        `补录：${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`,
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  resubmitReport: (reportId) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      if (!report) return state

      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? { ...r, status: 'submitted' as ReportStatus, submittedAt: now() }
          : r,
      )

      const op = ROLE_OPERATOR.caregiver
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'resubmit',
        op.id,
        op.name,
        'caregiver',
        '补录后重新提交',
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  updateReportField: (reportId, field) => {
    set((state) => {
      const updatedReports = state.reports.map((r) =>
        r.id === reportId ? { ...r, ...field } : r,
      )
      return { reports: updatedReports }
    })
  },

  markFamilyNotified: (reportId) => {
    set((state) => {
      const op = ROLE_OPERATOR.social_worker
      const updatedReports = state.reports.map((r) =>
        r.id === reportId ? { ...r, familyNotified: true } : r,
      )
      const report = state.reports.find((r) => r.id === reportId)
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'family_notify',
        op.id,
        op.name,
        'social_worker',
        `已通知家属：${report?.elderName || ''}异常情况`,
      )
      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  markFamilyConfirmed: (reportId) => {
    set((state) => {
      const op = ROLE_OPERATOR.social_worker
      const updatedReports = state.reports.map((r) =>
        r.id === reportId ? { ...r, familyConfirmed: true } : r,
      )
      const report = state.reports.find((r) => r.id === reportId)
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'family_confirm',
        op.id,
        op.name,
        'social_worker',
        `家属确认已知悉：${report?.elderName || ''}`,
      )
      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  getLogsForEntity: (entityId) => {
    return get().logs.filter((l) => l.entityId === entityId)
  },

  getReportForReminder: (reminderId) => {
    return get().reports.find((r) => r.reminderId === reminderId)
  },

  addAttachment: (reportId, attachment) => {
    set((state) => {
      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? { ...r, attachments: [...r.attachments, attachment] }
          : r,
      )

      const op = ROLE_OPERATOR[state.currentRole || 'caregiver']
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'add_attachment',
        op.id,
        op.name,
        state.currentRole || 'caregiver',
        `上传附件：${attachment.name}`,
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },

  removeAttachment: (reportId, attachmentId) => {
    set((state) => {
      const report = state.reports.find((r) => r.id === reportId)
      const attachment = report?.attachments.find((a) => a.id === attachmentId)

      const updatedReports = state.reports.map((r) =>
        r.id === reportId
          ? { ...r, attachments: r.attachments.filter((a) => a.id !== attachmentId) }
          : r,
      )

      const op = ROLE_OPERATOR[state.currentRole || 'caregiver']
      const updatedLogs = addLog(
        state.logs,
        'report',
        reportId,
        'remove_attachment',
        op.id,
        op.name,
        state.currentRole || 'caregiver',
        `删除附件：${attachment?.name || attachmentId}`,
      )

      return { reports: updatedReports, logs: updatedLogs }
    })
  },
}))
