import type { DeviceStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<DeviceStatus, { label: string; className: string }> = {
  received: { label: '待检测', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  inspecting: { label: '检测中', className: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  graded: { label: '已定级', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  confirmed: { label: '已确认', className: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
  paying: { label: '打款中', className: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  completed: { label: '已完成', className: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  returned: { label: '已退回', className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
}

export default function StatusBadge({ status, size = 'md' }: { status: DeviceStatus; size?: 'xs' | 'sm' | 'md' }) {
  const config = statusConfig[status]
  const sizeCls =
    size === 'xs' ? 'px-1.5 py-0 text-[10px] gap-0.5' :
    size === 'sm' ? 'px-1.5 py-0.5 text-[10px] gap-1' :
    'px-2 py-0.5 text-xs gap-1.5'
  return (
    <span className={cn('inline-flex items-center rounded font-medium', config.className, sizeCls)}>
      <span className={cn('rounded-full bg-current opacity-70 shrink-0', size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5')} />
      {config.label}
    </span>
  )
}
