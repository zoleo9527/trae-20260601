import { cn } from '@/lib/utils'
import type { Role } from '@/types'

const roleColor: Record<Role, string> = {
  receiver: 'bg-blue-500',
  inspector: 'bg-purple-500',
  finance: 'bg-green-500',
  manager: 'bg-cyan-500',
}

const roleLabel: Record<Role, string> = {
  receiver: '收货',
  inspector: '检测',
  finance: '财务',
  manager: '系统',
}

interface TimelineEntry {
  id?: string
  action: string
  operator: string
  role: Role
  detail: string
  timestamp: string
}

interface TimelineProps {
  entries: TimelineEntry[]
  highlightFirst?: boolean
  highlightId?: string
}

export default function Timeline({ entries, highlightFirst = false, highlightId }: TimelineProps) {
  return (
    <div className="relative">
      {entries.map((entry, i) => {
        const isFirst = i === 0
        const isHighlighted = highlightFirst ? isFirst : highlightId ? entry.id === highlightId : false
        return (
          <div
            key={entry.id ?? i}
            id={entry.id ? `history-${entry.id}` : undefined}
            className={cn(
              'relative pl-8 pb-6 last:pb-0 transition-all duration-300',
              isHighlighted && 'bg-brand-accent/5 -mx-3 px-3 py-3 rounded-lg border border-brand-accent/20 mb-1'
            )}
          >
            <div className={cn('absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center', isHighlighted && 'left-3')}>
              <span className={cn('w-3 h-3 rounded-full', roleColor[entry.role], isHighlighted && 'w-4 h-4 ring-4 ring-brand-accent/30')} />
            </div>
            {i < entries.length - 1 && (
              <div className={cn('absolute left-[9px] top-5 bottom-0 w-px bg-brand-border', isHighlighted && 'left-[17px]')} />
            )}
            <div className={cn('ml-2', isHighlighted && 'ml-4')}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={cn('text-sm font-medium', isHighlighted ? 'text-brand-accent' : 'text-gray-200')}>
                  {entry.action}
                </span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded text-white/80',
                  roleColor[entry.role]
                )}>
                  {roleLabel[entry.role]}
                </span>
                {isHighlighted && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded font-medium">
                    最新
                  </span>
                )}
                <span className="text-xs text-gray-500 ml-auto">{entry.timestamp}</span>
              </div>
              <div className="flex items-start gap-1 text-xs text-gray-400">
                <span className="shrink-0">{entry.operator}</span>
                <span className="text-gray-600 shrink-0">·</span>
                <span className={cn('text-gray-300', isHighlighted && 'text-gray-200')}>{entry.detail}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
