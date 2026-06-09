import { STATUS_LABELS, type ParcelStatus } from '../../shared/types'

const STATUS_STYLES: Record<string, string> = {
  arrived_pending: 'bg-amber-100 text-amber-800',
  dispatched_pending: 'bg-blue-100 text-blue-800',
  delivering: 'bg-indigo-100 text-indigo-800',
  signed: 'bg-green-100 text-green-800',
  problem_pending: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-600',
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status as ParcelStatus] ?? status
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
