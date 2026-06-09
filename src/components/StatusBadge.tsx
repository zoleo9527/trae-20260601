import { cn } from '@/lib/utils'
import type { ProblemStatus, DeliveryStatus, Role } from '../../shared/types'
import { PROBLEM_STATUS_LABELS, DELIVERY_STATUS_LABELS } from '../../shared/types'

const problemStatusColors: Record<ProblemStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacting: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  returned: 'bg-gray-100 text-gray-800',
  supplementing: 'bg-orange-100 text-orange-800',
  reviewing: 'bg-purple-100 text-purple-800',
  closed: 'bg-slate-100 text-slate-600',
}

const deliveryStatusColors: Record<DeliveryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  delivering: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  problem: 'bg-red-100 text-red-800',
  returned: 'bg-gray-100 text-gray-800',
}

export function ProblemStatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', problemStatusColors[status])}>
      {PROBLEM_STATUS_LABELS[status]}
    </span>
  )
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', deliveryStatusColors[status])}>
      {DELIVERY_STATUS_LABELS[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    station_cs: 'bg-indigo-100 text-indigo-800',
    courier: 'bg-emerald-100 text-emerald-800',
    station_manager: 'bg-amber-100 text-amber-800',
  }
  const labels: Record<Role, string> = {
    station_cs: '网点客服',
    courier: '派件员',
    station_manager: '驿站负责人',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[role])}>
      {labels[role]}
    </span>
  )
}
