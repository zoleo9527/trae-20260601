import { StatusTag } from '@/components/StatusTag'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS, REMINDER_STATUS_LABELS, type MedicationReminder } from '@/types'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Pill,
  User,
  X,
} from 'lucide-react'

interface ReminderDetailDrawerProps {
  reminderId: string
  isOpen: boolean
  onClose: () => void
  onViewReport?: (reportId: string) => void
}

function formatTime(iso: string | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReminderDetailDrawer({
  reminderId,
  isOpen,
  onClose,
  onViewReport,
}: ReminderDetailDrawerProps) {
  const reminder = useAppStore((s) =>
    s.reminders.find((r) => r.id === reminderId),
  )
  const allLogs = useAppStore((s) => s.logs)
  const logs = allLogs.filter((l) => l.entityId === reminderId)

  if (!isOpen || !reminder) return null

  const handleViewReport = () => {
    if (reminder.reportId && onViewReport) {
      onViewReport(reminder.reportId)
    }
  }

  const getAnomalyInfo = (reminder: MedicationReminder) => {
    if (reminder.status === 'abnormal' && reminder.abnormalNote) {
      return reminder.abnormalNote
    }
    if (reminder.status === 'timeout') {
      return '服药提醒超时未处理，已自动创建异常上报'
    }
    return null
  }

  const anomalyInfo = getAnomalyInfo(reminder)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] max-w-full bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">服药提醒详情</h2>
            <StatusTag status={reminder.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {(reminder.status === 'abnormal' || reminder.status === 'timeout') && reminder.reportId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                异常去向
              </div>
              <p className="text-sm text-amber-600 mb-3">
                {anomalyInfo}
              </p>
              <button
                onClick={handleViewReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
              >
                查看异常上报
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">基本信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">老人姓名</span>
                <span className="text-gray-900 font-medium">{reminder.elderName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">床位号</span>
                <span className="text-gray-900">{reminder.bedNo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">责任护工</span>
                <span className="text-gray-900">{reminder.caregiverName}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">药品信息</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Pill className="w-4 h-4 text-primary-500" />
                <span className="text-gray-500 w-20 shrink-0">药品名称</span>
                <span className="text-gray-900 font-medium">{reminder.medicationName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4" />
                <span className="text-gray-500 w-20 shrink-0">剂量</span>
                <span className="text-gray-900">{reminder.dosage}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">执行情况</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 w-20 shrink-0">计划时间</span>
                <span className="text-gray-900">{formatTime(reminder.scheduledTime)}</span>
              </div>
              {reminder.confirmedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-gray-500 w-20 shrink-0">处理时间</span>
                  <span className="text-gray-900">{formatTime(reminder.confirmedAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4" />
                <span className="text-gray-500 w-20 shrink-0">当前状态</span>
                <span className="text-gray-900">{REMINDER_STATUS_LABELS[reminder.status]}</span>
              </div>
              {reminder.status === 'abnormal' && reminder.abnormalNote && (
                <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span className="text-gray-500 w-20 shrink-0">异常说明</span>
                  <span className="text-gray-900 flex-1">{reminder.abnormalNote}</span>
                </div>
              )}
            </div>
          </section>

          {logs.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">操作日志</h3>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm py-2">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{log.operatorName}</span>
                        <span className="text-gray-400">{log.detail}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
