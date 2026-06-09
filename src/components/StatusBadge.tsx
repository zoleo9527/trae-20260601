import { ScheduleStatus, SCHEDULE_STATUS_LABELS } from '@/lib/types'

const statusColors: Record<ScheduleStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  URGED: 'bg-accent-50 text-accent-500 border border-accent-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RETURNED: 'bg-red-50 text-red-700 border border-red-200',
  SUPPLEMENTING: 'bg-blue-50 text-blue-700 border border-blue-200',
  IN_TREATMENT: 'bg-purple-50 text-purple-700 border border-purple-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through',
}

interface Props {
  status: ScheduleStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${statusColors[status]}`}>
      {SCHEDULE_STATUS_LABELS[status]}
    </span>
  )
}
