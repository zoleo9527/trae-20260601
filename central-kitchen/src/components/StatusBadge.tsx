import clsx from 'clsx'
import {
  MEAL_ORDER_STATUS_LABELS,
  MEAL_ORDER_STATUS_COLORS,
  SHORTAGE_STATUS_LABELS,
  SHORTAGE_STATUS_COLORS,
} from '@/constants/statusMachine'
import type { MealOrderStatus, ShortageStatus } from '@/types'

interface StatusBadgeProps {
  status: MealOrderStatus | ShortageStatus
  isShortage?: boolean
  className?: string
}

export function StatusBadge({ status, isShortage = false, className }: StatusBadgeProps) {
  const labels = isShortage ? SHORTAGE_STATUS_LABELS : MEAL_ORDER_STATUS_LABELS
  const colors = isShortage ? SHORTAGE_STATUS_COLORS : MEAL_ORDER_STATUS_COLORS

  return (
    <span className={clsx('badge', colors[status as keyof typeof colors], className)}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
