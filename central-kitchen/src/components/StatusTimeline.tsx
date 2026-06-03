import { CheckCircle, Circle, Clock } from 'lucide-react'
import type { StatusLog } from '@/types'
import {
  MEAL_ORDER_STATUS_LABELS,
  SHORTAGE_STATUS_LABELS,
  ROLE_LABELS,
} from '@/constants/statusMachine'

interface StatusTimelineProps {
  logs: StatusLog[]
  isShortage?: boolean
}

export function StatusTimeline({ logs, isShortage = false }: StatusTimelineProps) {
  const labels = isShortage ? SHORTAGE_STATUS_LABELS : MEAL_ORDER_STATUS_LABELS

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="space-y-4">
      {sortedLogs.map((log, index) => {
        const isLast = index === sortedLogs.length - 1
        const statusLabel = labels[log.status as keyof typeof labels] || log.status

        return (
          <div key={log.id} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-[11px] top-6 w-0.5 h-full bg-neutral-200" />
            )}
            <div className="relative z-10 flex-shrink-0">
              {isLast ? (
                <CheckCircle className="w-6 h-6 text-success-500" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-300" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-neutral-900">{statusLabel}</span>
                <span className="text-xs text-neutral-500">
                  {ROLE_LABELS[log.operatorRole]} · {log.operator}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                <Clock className="w-3 h-3" />
                {new Date(log.timestamp).toLocaleString('zh-CN')}
              </div>
              {log.remark && (
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 mt-2">
                  {log.remark}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
