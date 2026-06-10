import { cn } from '@/lib/utils'

interface TimelineItem {
  id: string
  title: string
  subtitle?: string
  timestamp: string
  highlight?: boolean
}

interface TimelineProps {
  items: TimelineItem[]
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0 mt-1.5',
                item.highlight ? 'bg-orange-500' : 'bg-slate-300'
              )}
            />
            {index < items.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 mt-1" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
              <span className="text-xs text-slate-400 shrink-0">{getRelativeTime(item.timestamp)}</span>
            </div>
            {item.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
