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

export default function Timeline({ entries }: { entries: { action: string; operator: string; role: Role; detail: string; timestamp: string }[] }) {
  return (
    <div className="relative">
      {entries.map((entry, i) => (
        <div key={i} className="relative pl-8 pb-6 last:pb-0">
          <div className="absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center">
            <span className={cn('w-3 h-3 rounded-full', roleColor[entry.role])} />
          </div>
          {i < entries.length - 1 && (
            <div className="absolute left-[9px] top-5 bottom-0 w-px bg-brand-border" />
          )}
          <div className="ml-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-gray-200">{entry.action}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded text-white/80',
                roleColor[entry.role]
              )}>
                {roleLabel[entry.role]}
              </span>
              <span className="text-xs text-gray-500 ml-auto">{entry.timestamp}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{entry.operator}</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-300">{entry.detail}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
