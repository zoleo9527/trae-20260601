import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import type { Order } from '@/types'
import {
    MEAL_TYPE_LABELS,
    ORDER_STATUS_LABELS,
    STATUS_COLORS,
    SUBSIDY_COLORS,
    SUBSIDY_TYPE_LABELS,
    getRefundStatusColor,
    getRefundStatusLabel,
} from '@/types'
import { AlertTriangle, Check, Clock, Flame, RotateCcw, X } from 'lucide-react'

function getStatusDisplay(order: Order) {
  if (order.status === 'refund_requested') {
    return {
      label: getRefundStatusLabel(order.statusBeforeRefund),
      color: getRefundStatusColor(order.statusBeforeRefund),
      icon: 'refund' as const,
    }
  }
  return {
    label: ORDER_STATUS_LABELS[order.status],
    color: STATUS_COLORS[order.status],
    icon: order.status as Order['status'],
  }
}

function getAbnormalTags(order: Order) {
  const tags: { label: string; color: string }[] = []
  if (order.subsidyExpired) {
    tags.push({ label: '补贴过期', color: 'bg-red-100 text-red-700' })
  }
  if (order.duplicateOrder) {
    tags.push({ label: '重复订餐', color: 'bg-amber-100 text-amber-700' })
  }
  return tags
}

function StatusIcon({ status }: { status: Order['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock size={14} className="text-sky-500" />
    case 'served':
      return <Flame size={14} className="text-emerald-500" />
    case 'verified':
      return <Check size={14} className="text-green-600" />
    case 'cancelled':
      return <X size={14} className="text-gray-400" />
    case 'refund_requested':
      return <RotateCcw size={14} className="text-red-500" />
    default:
      return null
  }
}

export default function OrderCard({ order }: { order: Order }) {
  const { selectedOrderIds, toggleSelectOrder, setActiveOrder, activeOrderId } = useOrderStore()
  const isSelected = selectedOrderIds.has(order.id)
  const isActive = activeOrderId === order.id
  const abnormalTags = getAbnormalTags(order)
  const statusDisplay = getStatusDisplay(order)
  const isSelectable = order.status === 'served'

  return (
    <div
      className={cn(
        'relative rounded-xl border p-3.5 cursor-pointer transition-all duration-150',
        isActive
          ? 'border-orange-300 bg-orange-50/60 shadow-sm ring-1 ring-orange-200'
          : abnormalTags.length > 0
          ? 'border-red-200 bg-red-50/30 hover:border-red-300 hover:shadow-sm'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
      )}
      onClick={() => setActiveOrder(order.id)}
    >
      <div className="flex items-start gap-3">
        {isSelectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              toggleSelectOrder(order.id)
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
          />
        )}
        {!isSelectable && <div className="w-4 mt-1" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-stone-800 text-sm truncate">
              {order.elderName}
            </span>
            <span
              className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded',
                SUBSIDY_COLORS[order.subsidyType]
              )}
            >
              {SUBSIDY_TYPE_LABELS[order.subsidyType]}
            </span>
            {order.isTemporary && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                临时
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1.5">
            <span className="font-medium text-stone-600">{MEAL_TYPE_LABELS[order.mealType]}</span>
            <span>·</span>
            <span className="truncate">{order.dishName}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded',
                statusDisplay.color
              )}
            >
              <StatusIcon status={statusDisplay.icon === 'refund' ? 'refund_requested' : statusDisplay.icon} />
              {statusDisplay.label}
            </span>

            {abnormalTags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded',
                  tag.color
                )}
              >
                <AlertTriangle size={10} />
                {tag.label}
              </span>
            ))}
          </div>

          {order.note && (
            <p className="mt-1.5 text-xs text-stone-400 truncate">📝 {order.note}</p>
          )}
        </div>
      </div>
    </div>
  )
}
