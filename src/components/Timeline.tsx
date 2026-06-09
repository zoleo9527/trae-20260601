import { cn } from '@/lib/utils'
import type { TimelineEntry } from '@/store'

const actionColors: Record<string, string> = {
  create: 'bg-indigo-500',
  submit: 'bg-blue-500',
  start_review: 'bg-purple-500',
  complete_review: 'bg-green-500',
  complete: 'bg-green-600',
  review_abnormal: 'bg-red-500',
  process_issue: 'bg-amber-500',
  issue_processed: 'bg-amber-600',
}

function getDotColor(action: string) {
  return actionColors[action] || 'bg-gray-400'
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

interface TimelineProps {
  entries: TimelineEntry[]
  className?: string
}

export default function Timeline({ entries, className }: TimelineProps) {
  if (!entries.length) {
    return <p className="text-sm text-gray-400">暂无操作记录</p>
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="timeline-entry relative flex gap-3 pl-6">
            <div
              className={cn(
                'absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white',
                getDotColor(entry.action)
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{entry.operator}</span>
                <span className="text-xs text-gray-400">{entry.operatorRole}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatTime(entry.createdAt)}</p>
              {entry.detail && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
