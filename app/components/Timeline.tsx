import { AlertTriangle } from 'lucide-react'
import { USER_ROLE_LABELS, STUCK_POINT_LABELS } from 'shared/types'
import type { TimelineEvent, UserRole } from 'shared/types'

const statusDotColors: Record<string, string> = {
  created: 'bg-gray-400',
  assigned: 'bg-blue-400',
  status_changed: 'bg-amber-400',
  appeal_submitted: 'bg-purple-400',
  rejected: 'bg-red-400',
  closed: 'bg-emerald-400',
  batch_assigned: 'bg-blue-400',
  batch_processing: 'bg-amber-400',
  batch_closed: 'bg-emerald-400',
  evidence_review_started: 'bg-cyan-400',
  evidence_review_updated: 'bg-cyan-400',
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Timeline({ events, stuckPoint }: { events: TimelineEvent[]; stuckPoint?: string | null }) {
  if (events.length === 0 && !stuckPoint) {
    return <div className="text-park-muted text-sm py-4">暂无操作记录</div>
  }

  return (
    <div className="relative">
      {stuckPoint && (
        <div className="flex gap-4 pb-6">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-red-500 animate-pulse" />
            {events.length > 0 && (
              <div className="w-px flex-1 bg-park-border mt-1" />
            )}
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">卡点: {STUCK_POINT_LABELS[stuckPoint] || stuckPoint}</span>
            </div>
            <div className="text-park-muted text-xs mt-0.5">该工单当前在此环节停滞，需要及时处理</div>
          </div>
        </div>
      )}

      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusDotColors[event.action] || 'bg-gray-400'} ${event.action === 'appeal_submitted' ? 'ring-2 ring-purple-400/40' : ''}`} />
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-park-border mt-1" />
            )}
          </div>
          <div className="flex-1 -mt-0.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-park-text font-medium">{event.operator_name}</span>
              <span className="text-park-muted text-xs">{USER_ROLE_LABELS[event.operator_role as UserRole]}</span>
              {event.action === 'appeal_submitted' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[10px] font-medium">申诉</span>
              )}
            </div>
            {event.action === 'appeal_submitted' ? (
              <div className="mt-1.5 bg-purple-500/10 border border-purple-500/30 rounded p-2">
                <div className="text-purple-300 text-xs mb-0.5 font-medium">申诉理由</div>
                <div className="text-park-text text-sm">{event.detail}</div>
              </div>
            ) : (
              <div className="text-park-muted text-xs mt-0.5">{event.detail}</div>
            )}
            <div className="text-park-muted/60 text-xs mt-1">{formatTime(event.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
