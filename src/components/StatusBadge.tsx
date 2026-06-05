type BadgeType = 'booking' | 'anomaly' | 'equipment' | 'severity'

const bookingStatusMap: Record<string, { label: string; classes: string }> = {
  pending: { label: '待确认', classes: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', classes: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', classes: 'bg-orange-100 text-orange-800' },
  completed: { label: '已完成', classes: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', classes: 'bg-gray-100 text-gray-600' },
}

const anomalyStatusMap: Record<string, { label: string; classes: string }> = {
  open: { label: '未关闭', classes: 'bg-red-100 text-red-800' },
  resolved: { label: '已关闭', classes: 'bg-green-100 text-green-800' },
}

const equipmentStatusMap: Record<string, { label: string; classes: string }> = {
  returned: { label: '已归还', classes: 'bg-green-100 text-green-800' },
  unreturned: { label: '未归还', classes: 'bg-orange-100 text-orange-800' },
}

const severityMap: Record<string, { label: string; classes: string }> = {
  high: { label: '高', classes: 'bg-red-100 text-red-800' },
  medium: { label: '中', classes: 'bg-orange-100 text-orange-800' },
  low: { label: '低', classes: 'bg-blue-100 text-blue-800' },
}

interface StatusBadgeProps {
  type: BadgeType
  status: string
}

export default function StatusBadge({ type, status }: StatusBadgeProps) {
  const map =
    type === 'booking'
      ? bookingStatusMap
      : type === 'anomaly'
        ? anomalyStatusMap
        : type === 'equipment'
          ? equipmentStatusMap
          : severityMap

  const entry = map[status]
  if (!entry) return null

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.classes}`}>
      {entry.label}
    </span>
  )
}
