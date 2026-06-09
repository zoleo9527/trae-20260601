import type { StatusLog, FollowUpStatus } from '@/types'
import { STATUS_LABELS, ROLE_LABELS } from '@/types'
import { formatTimeAgo, getStatusColor } from '@/utils/statusEngine'

const dotColors: Record<FollowUpStatus, string> = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  pending_review: 'bg-amber-500',
  completed: 'bg-emerald-500',
  warned: 'bg-red-500',
  confirmed: 'bg-teal-500',
}

interface StatusTimelineProps {
  logs: StatusLog[]
}

export default function StatusTimeline({ logs }: StatusTimelineProps) {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime()
  )

  return (
    <div className="relative pl-6">
      {sorted.map((log, idx) => {
        const isLast = idx === sorted.length - 1
        return (
          <div key={log.id} className="relative pb-6 last:pb-0">
            <div
              className={`absolute left-[-1.375rem] top-1 h-3 w-3 rounded-full ${dotColors[log.toStatus]} ring-2 ring-white`}
            />
            {!isLast && (
              <div className="absolute left-[-0.875rem] top-4 bottom-0 w-px bg-slate-200" />
            )}
            <div className="ml-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">
                  {log.fromStatus ? STATUS_LABELS[log.fromStatus] : '—'}
                </span>
                <span className="text-slate-400">→</span>
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    log.toStatus === 'warned'
                      ? 'text-red-600'
                      : log.toStatus === 'completed'
                      ? 'text-emerald-600'
                      : log.toStatus === 'confirmed'
                      ? 'text-teal-600'
                      : 'text-slate-800'
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusColor(log.toStatus)}`} />
                  {STATUS_LABELS[log.toStatus]}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span>
                  {log.operatorName}（{ROLE_LABELS[log.operatorRole]}）
                </span>
                <span>·</span>
                <span>{formatTimeAgo(log.operatedAt)}</span>
              </div>
              {log.remark && (
                <p className="mt-1 text-xs text-slate-500">{log.remark}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
