import type { TimelineEvent } from '@/lib/api'

const eventTypeColors: Record<string, string> = {
  '创建': 'bg-blue-500',
  '放行': 'bg-green-500',
  '退回': 'bg-red-500',
  '确认': 'bg-blue-500',
  '到场': 'bg-purple-500',
  '完成': 'bg-green-500',
  '取消': 'bg-gray-500',
  '异常': 'bg-red-500',
}

const eventTypeBadgeColors: Record<string, string> = {
  '创建': 'bg-blue-100 text-blue-700',
  '放行': 'bg-green-100 text-green-700',
  '退回': 'bg-red-100 text-red-700',
  '确认': 'bg-blue-100 text-blue-700',
  '到场': 'bg-purple-100 text-purple-700',
  '完成': 'bg-green-100 text-green-700',
  '取消': 'bg-gray-100 text-gray-700',
  '异常': 'bg-red-100 text-red-700',
}

interface TimelineProps {
  events: TimelineEvent[]
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 py-4">暂无时间线记录</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-5">
        {events.map((event) => {
          const dotColor = eventTypeColors[event.event_type] || 'bg-gray-400'
          const badgeColor = eventTypeBadgeColors[event.event_type] || 'bg-gray-100 text-gray-700'
          return (
            <div key={event.id} className="relative pl-10">
              <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white`} />
              <div className="flex items-start gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColor}`}>
                  {event.event_type}
                </span>
                <div className="flex-1 min-w-0">
                  {event.description && (
                    <p className="text-sm text-gray-700">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {event.operator && <span>操作人：{event.operator}</span>}
                    <span>{new Date(event.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
