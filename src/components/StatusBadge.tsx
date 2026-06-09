import { cn } from '@/lib/utils'
import type { OutboundOrderStatus } from '@/store'

const statusConfig: Record<OutboundOrderStatus, { label: string; className: string }> = {
  pending_submit: { label: '待提交', className: 'bg-gray-100 text-gray-600' },
  pending_review: { label: '待复核', className: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '复核中', className: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  has_issue: { label: '已异常', className: 'bg-red-100 text-red-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-500' },
}

interface StatusBadgeProps {
  status: OutboundOrderStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending_submit
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
