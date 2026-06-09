const containerStatusColors: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-700',
  overstay: 'bg-red-100 text-red-700',
  inspecting: 'bg-amber-100 text-amber-700',
  departed: 'bg-gray-100 text-gray-600',
  disputed: 'bg-purple-100 text-purple-700',
  misplaced: 'bg-red-100 text-red-700',
}

const overstayStatusColors: Record<string, string> = {
  pending_notify: 'bg-orange-100 text-orange-700',
  notified: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  closed: 'bg-emerald-100 text-emerald-700',
}

const feeReviewStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  disputed: 'bg-purple-100 text-purple-700',
}

const statusLabels: Record<string, string> = {
  normal: '正常',
  overstay: '超期',
  inspecting: '查验中',
  departed: '已离场',
  misplaced: '错位',
  pending_notify: '待通知',
  notified: '已通知',
  processing: '处理中',
  closed: '已关闭',
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  disputed: '争议',
}

interface StatusBadgeProps {
  status: string
  type?: 'container' | 'overstay' | 'fee'
}

export default function StatusBadge({ status, type = 'container' }: StatusBadgeProps) {
  const colorMap =
    type === 'overstay'
      ? overstayStatusColors
      : type === 'fee'
      ? feeReviewStatusColors
      : containerStatusColors

  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-600'
  const label = statusLabels[status] || status

  return (
    <span className={`status-badge ${colorClass}`}>
      {label}
    </span>
  )
}
