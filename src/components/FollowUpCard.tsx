import type { FollowUp } from '@/types'
import { STATUS_LABELS, ROLE_LABELS } from '@/types'
import { getStatusColor, getDeadlineInfo } from '@/utils/statusEngine'
import { isIndicatorAbnormal } from '@/utils/warningEngine'
import { Clock, User, Activity, AlertTriangle } from 'lucide-react'
import { useWarningStore } from '@/store/useWarningStore'

interface FollowUpCardProps {
  followUp: FollowUp
  patientName: string
  diseaseType: string
  isSelected: boolean
  onClick: () => void
}

export default function FollowUpCard({
  followUp,
  patientName,
  diseaseType,
  isSelected,
  onClick,
}: FollowUpCardProps) {
  const deadlineInfo = getDeadlineInfo(followUp.createdAt, followUp.deadlineHours, followUp.status)
  const abnormalCount = followUp.indicators.filter(isIndicatorAbnormal).length
  const warnings = useWarningStore((s) =>
    s.warnings.filter((w) => w.followUpId === followUp.id && (w.status === 'active' || w.status === 'processing'))
  )

  return (
    <div
      onClick={onClick}
      className={`relative flex cursor-pointer overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md ${
        isSelected ? 'ring-2 ring-emerald-500' : ''
      }`}
    >
      <div className={`w-1.5 shrink-0 ${getStatusColor(followUp.status)}`} />

      <div className="flex-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">{patientName}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${getStatusColor(followUp.status)}`}
          >
            {STATUS_LABELS[followUp.status]}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Activity className="h-3 w-3" />
          <span>{diseaseType}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span>
              {followUp.assigneeName}({ROLE_LABELS[followUp.assigneeRole]})
            </span>
          </div>

          {deadlineInfo.text && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {deadlineInfo.urgent && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
              <Clock className="h-3 w-3" />
              <span className={deadlineInfo.urgent ? 'font-medium text-red-600' : ''}>
                {deadlineInfo.text}
              </span>
            </div>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {abnormalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
              <Activity className="h-3 w-3" />
              {abnormalCount}项异常
            </span>
          )}
          {warnings.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {warnings.length}条预警
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
