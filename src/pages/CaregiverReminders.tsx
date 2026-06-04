import { ReportDetailDrawer } from '@/components/ReportDetailDrawer'
import { Sidebar } from '@/components/Sidebar'
import { StatusTag } from '@/components/StatusTag'
import { useAppStore } from '@/store'
import { ANOMALY_TYPE_LABELS, type AnomalyType } from '@/types'
import { Check, Clock, Coffee, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface TimeGroup {
  label: string
  range: string
  icon: React.ReactNode
  minHour: number
  maxHour: number
}

const TIME_GROUPS: TimeGroup[] = [
  { label: '早晨', range: '6:00 - 9:00', icon: <Sun className="w-5 h-5 text-amber-500" />, minHour: 6, maxHour: 9 },
  { label: '中午', range: '11:00 - 13:00', icon: <Coffee className="w-5 h-5 text-orange-500" />, minHour: 11, maxHour: 13 },
  { label: '下午', range: '14:00 - 17:00', icon: <Clock className="w-5 h-5 text-blue-500" />, minHour: 14, maxHour: 17 },
  { label: '晚上', range: '18:00 - 21:00', icon: <Moon className="w-5 h-5 text-indigo-500" />, minHour: 18, maxHour: 21 },
]

function formatScheduledTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const ANOMALY_OPTIONS: { value: AnomalyType; label: string }[] = [
  { value: 'medication_refused', label: '拒服药物' },
  { value: 'adverse_reaction', label: '不良反应' },
  { value: 'timeout', label: '超时未处理' },
  { value: 'other', label: '其他异常' },
]

function AnomalyTypeModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: AnomalyType) => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">选择异常类型</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {ANOMALY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CaregiverReminders() {
  const reminders = useAppStore((s) => s.reminders)
  const confirmReminder = useAppStore((s) => s.confirmReminder)
  const markReminderAbnormal = useAppStore((s) => s.markReminderAbnormal)
  const getReportForReminder = useAppStore((s) => s.getReportForReminder)

  const navigate = useNavigate()

  const [drawerReportId, setDrawerReportId] = useState<string | null>(null)
  const [anomalyModalReminderId, setAnomalyModalReminderId] = useState<string | null>(null)

  const getHour = (iso: string) => new Date(iso).getHours()

  const groupedReminders = TIME_GROUPS.map((group) => ({
    ...group,
    reminders: reminders.filter((r) => {
      const h = getHour(r.scheduledTime)
      return h >= group.minHour && h < group.maxHour
    }),
  }))

  const handleMarkAbnormal = (reminderId: string, anomalyType: AnomalyType) => {
    const note = ANOMALY_TYPE_LABELS[anomalyType]
    const reportId = markReminderAbnormal(reminderId, note)
    setAnomalyModalReminderId(null)
    navigate(`/caregiver/report?draft=${reportId}`)
  }

  const handleStatusTagClick = (reportId: string | undefined) => {
    if (reportId) {
      setDrawerReportId(reportId)
    }
  }

  const handleReminderClick = (reminderId: string) => {
    const report = getReportForReminder(reminderId)
    if (report) {
      setDrawerReportId(report.id)
    }
  }

  return (
    <div className="flex h-full">
      <Sidebar role="caregiver" />
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">服药提醒</h2>

        <div className="space-y-8">
          {groupedReminders.map((group) => {
            if (group.reminders.length === 0) return null

            return (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-4">
                  {group.icon}
                  <h3 className="text-base font-semibold text-gray-900">{group.label}</h3>
                  <span className="text-sm text-gray-400">{group.range}</span>
                </div>

                <div className="relative ml-4 pl-6 border-l-2 border-gray-200 space-y-4">
                  {group.reminders.map((reminder) => (
                    <div key={reminder.id} className="relative">
                      <div className="absolute -left-[29px] top-3 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {reminder.elderName}
                              </span>
                              <span className="text-xs text-gray-500">{reminder.bedNo}</span>
                              <span className="text-xs text-gray-400">
                                {formatScheduledTime(reminder.scheduledTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <span className="font-medium">{reminder.medicationName}</span>
                              <span className="text-gray-400">{reminder.dosage}</span>
                            </div>
                          </div>
                          <StatusTag
                            status={reminder.status}
                            onClick={() => handleReminderClick(reminder.id)}
                            pulse={reminder.status === 'timeout'}
                          />
                        </div>

                        {reminder.status === 'pending' && (
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => confirmReminder(reminder.id)}
                              className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              确认服药
                            </button>
                            <button
                              onClick={() => setAnomalyModalReminderId(reminder.id)}
                              className="px-4 py-1.5 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              标记异常
                            </button>
                          </div>
                        )}

                        {reminder.status === 'confirmed' && reminder.confirmedAt && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-sm text-green-600">
                            <Check className="w-4 h-4" />
                            <span>已于 {formatScheduledTime(reminder.confirmedAt)} 确认服药</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ReportDetailDrawer
        reportId={drawerReportId || ''}
        isOpen={!!drawerReportId}
        onClose={() => setDrawerReportId(null)}
      />

      <AnomalyTypeModal
        isOpen={!!anomalyModalReminderId}
        onClose={() => setAnomalyModalReminderId(null)}
        onSelect={(type) => {
          if (anomalyModalReminderId) {
            handleMarkAbnormal(anomalyModalReminderId, type)
          }
        }}
      />
    </div>
  )
}
