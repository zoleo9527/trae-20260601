import { cn } from '@/lib/utils'

type DiversionStatus = 'pending' | 'diverted' | 'confirmed' | 'completed' | 'rejected' | 'approved'
type MissedStatus = 'pending' | 'reminded' | 'confirmed' | 'completed' | 'closed'

const diversionMap: Record<DiversionStatus, { label: string; className: string }> = {
  pending: { label: '待分流', className: 'bg-accent-50 text-accent-600 border-accent-200' },
  diverted: { label: '已分流', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  confirmed: { label: '科室已确认', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '科室已完成', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  rejected: { label: '已打回', className: 'bg-red-50 text-red-600 border-red-200' },
  approved: { label: '审核通过', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
}

const missedMap: Record<MissedStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-accent-50 text-accent-600 border-accent-200' },
  reminded: { label: '已提醒', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  confirmed: { label: '待补检', className: 'bg-purple-50 text-purple-600 border-purple-200' },
  completed: { label: '已补检', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  closed: { label: '已关闭', className: 'bg-gray-50 text-gray-500 border-gray-200' },
}

interface StatusBadgeProps {
  status: string
  type: 'diversion' | 'missed'
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const map = type === 'diversion' ? diversionMap : missedMap
  const entry = (map as Record<string, { label: string; className: string }>)[status]

  if (!entry) return null

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border',
        entry.className
      )}
    >
      {entry.label}
    </span>
  )
}
