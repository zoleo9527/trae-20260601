import type { IncidentStatus } from '@/shared/types'
import { STATUS_LABELS } from '@/shared/types'

const statusStyles: Record<IncidentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  review: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  archived: 'bg-slate-50 text-slate-600 ring-slate-500/20',
}

const dotStyles: Record<IncidentStatus, string> = {
  pending: 'bg-amber-500',
  processing: 'bg-blue-500',
  review: 'bg-purple-500',
  completed: 'bg-emerald-500',
  archived: 'bg-slate-400',
}

interface StatusBadgeProps {
  status: IncidentStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyles[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}
