import { CheckinStatus, CHECKIN_STATUS_LABELS } from '@/lib/types'

const statusColors: Record<CheckinStatus, string> = {
  WAITING: 'bg-gray-100 text-gray-700',
  CHECKED_IN: 'bg-blue-50 text-blue-700 border border-blue-200',
  IN_TREATMENT: 'bg-purple-50 text-purple-700 border border-purple-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through',
}

interface Props {
  status: CheckinStatus
  size?: 'sm' | 'md'
}

export default function CheckinStatusBadge({ status, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${statusColors[status]}`}>
      {CHECKIN_STATUS_LABELS[status]}
    </span>
  )
}
