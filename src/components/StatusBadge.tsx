import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  vacant: { label: '空房', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  occupied: { label: '住客', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cleaning: { label: '清洁中', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  repair: { label: '维修中', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  pending_inspect: { label: '待检', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  pending: { label: '待处理', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  in_progress: { label: '进行中', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  completed: { label: '已完成', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: '已取消', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pending_clean: { label: '待保洁', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  pending_inspect_flow: { label: '待检查', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  recovered: { label: '已恢复', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

const urgencyConfig: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  normal: { label: '普通', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  high: { label: '高', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  urgent: { label: '紧急', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function StatusBadge({ status, type = 'room' }: { status: string; type?: 'room' | 'repair' | 'recovery' | 'urgency' }) {
  const configMap = type === 'urgency' ? urgencyConfig : statusConfig
  const key = status === 'pending_inspect' && type === 'recovery' ? 'pending_inspect_flow' : status
  const config = configMap[key] || { label: status, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
