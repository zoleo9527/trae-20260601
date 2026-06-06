import { PurchaseStatus } from '../types'
import { statusConfig, cn } from '../utils'

interface StatusBadgeProps {
  status: PurchaseStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('badge', config.bgColor, config.color, className)}>
      {config.label}
    </span>
  )
}
