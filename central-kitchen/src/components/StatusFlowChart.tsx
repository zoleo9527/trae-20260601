import clsx from 'clsx'
import {
  MEAL_ORDER_STATUS_LABELS,
  MEAL_ORDER_STATUS_COLORS,
  SHORTAGE_STATUS_LABELS,
  SHORTAGE_STATUS_COLORS,
} from '@/constants/statusMachine'
import type { MealOrderStatus, ShortageStatus } from '@/types'

interface StatusNode {
  status: string
  label: string
  color: string
  isActive: boolean
  isPast: boolean
}

interface StatusFlowChartProps {
  currentStatus: MealOrderStatus | ShortageStatus
  isShortage?: boolean
  className?: string
}

const MEAL_ORDER_FLOW: MealOrderStatus[] = [
  'draft',
  'submitted',
  'production_review',
  'production_approved',
  'distributed',
  'received',
]

const SHORTAGE_FLOW: ShortageStatus[] = [
  'pending_review',
  'supply_review',
  'supply_approved',
  'replenishing',
  'replenished',
  'supervisor_review',
  'closed',
]

export function StatusFlowChart({ currentStatus, isShortage = false, className }: StatusFlowChartProps) {
  const flow = (isShortage ? SHORTAGE_FLOW : MEAL_ORDER_FLOW) as string[]
  const labels = isShortage ? SHORTAGE_STATUS_LABELS : MEAL_ORDER_STATUS_LABELS
  const colors = isShortage ? SHORTAGE_STATUS_COLORS : MEAL_ORDER_STATUS_COLORS

  const currentIndex = flow.indexOf(currentStatus)

  const nodes: StatusNode[] = flow.map((status, index) => ({
    status,
    label: labels[status as keyof typeof labels],
    color: colors[status as keyof typeof colors],
    isActive: index === currentIndex,
    isPast: index < currentIndex,
  }))

  if (isShortage && (currentStatus === 'supply_rejected' || currentStatus === 'shortage_reported')) {
    nodes.push({
      status: 'supply_rejected',
      label: '材料待补充',
      color: 'bg-red-50 text-red-600 border-red-200',
      isActive: currentStatus === 'supply_rejected',
      isPast: false,
    })
  }

  if (!isShortage && currentStatus === 'production_rejected') {
    nodes.push({
      status: 'production_rejected',
      label: '生产驳回',
      color: 'bg-red-50 text-red-600 border-red-200',
      isActive: true,
      isPast: false,
    })
  }

  if (!isShortage && currentStatus === 'shortage_reported') {
    nodes.push({
      status: 'shortage_reported',
      label: '已报缺货',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      isActive: true,
      isPast: false,
    })
  }

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)}>
      {nodes.map((node, index) => (
        <div key={node.status} className="flex items-center">
          <div
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all',
              node.color,
              node.isActive && 'ring-2 ring-offset-1 ring-primary-400 scale-105',
              node.isPast && 'opacity-60'
            )}
          >
            {node.isPast && '✓ '}
            {node.label}
          </div>
          {index < nodes.length - 1 && (
            <div className="w-6 h-0.5 bg-neutral-200 mx-1">
              {node.isPast && <div className="h-full bg-primary-400" />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
