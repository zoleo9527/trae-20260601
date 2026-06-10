import { COMPLAINT_STATUS_LABELS } from '../../shared/types'
import type { ComplaintStatus } from '../../shared/types'

const statusColors: Record<ComplaintStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  assigned: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-amber-500/20 text-amber-400',
  appealing: 'bg-purple-500/20 text-purple-400',
  rejected: 'bg-red-500/20 text-red-400',
  closed: 'bg-emerald-500/20 text-emerald-400',
}

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {COMPLAINT_STATUS_LABELS[status]}
    </span>
  )
}
