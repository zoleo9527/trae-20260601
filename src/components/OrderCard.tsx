import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import type { MaintenanceOrder, MaintenanceType, OrderStatus } from '@/types'
import { Calendar, CheckSquare, MapPin, Square, User } from 'lucide-react'
import { Link } from 'react-router-dom'

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: '待签到', className: 'bg-amber-100 text-amber-700' },
  checked_in: { label: '已签到', className: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', className: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已退回', className: 'bg-red-100 text-red-700' },
}

const typeConfig: Record<MaintenanceType, { label: string; className: string }> = {
  routine: { label: '日常', className: 'bg-slate-100 text-slate-600' },
  quarterly: { label: '季度', className: 'bg-slate-100 text-slate-600' },
  annual: { label: '年度', className: 'bg-slate-100 text-slate-600' },
}

interface OrderCardProps {
  order: MaintenanceOrder
  selectable: boolean
  onQuickAction?: (order: MaintenanceOrder) => void
}

export default function OrderCard({ order, selectable, onQuickAction }: OrderCardProps) {
  const { currentRole, selectedIds, toggleSelect } = useStore()
  const isClosed = order.status === 'completed' || order.status === 'rejected'
  const isSelected = !isClosed && selectedIds.includes(order.id)
  const status = statusConfig[order.status]
  const type = typeConfig[order.maintenanceType]

  const showQuickAction =
    (currentRole === 'technician' && order.status === 'pending') ||
    (currentRole === 'service' && order.status === 'checked_in') ||
    (currentRole === 'supervisor' && order.status === 'reviewing')

  const quickActionLabel =
    currentRole === 'technician'
      ? '签到'
      : currentRole === 'service'
        ? '推进'
        : '审核'

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        isSelected && 'ring-2 ring-amber-400'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {selectable && !isClosed && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleSelect(order.id)
              }}
              className="mt-0.5 shrink-0"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-amber-500" />
              ) : (
                <Square className="h-4 w-4 text-slate-300" />
              )}
            </button>
          )}
          {selectable && isClosed && (
            <div className="mt-0.5 shrink-0">
              <Square className="h-4 w-4 text-slate-200" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/order/${order.id}`}
                className="text-base font-semibold text-slate-900 hover:text-amber-600 transition-colors truncate"
              >
                {order.elevatorNo}
              </Link>
              <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', type.className)}>
                {type.label}
              </span>
              <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', status.className)}>
                {status.label}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{order.elevatorAddress}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {order.plannedDate}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {order.assignedTechnician}
              </span>
            </div>
          </div>
        </div>

        {showQuickAction && onQuickAction && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickAction(order)
            }}
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
          >
            {quickActionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
