import { cn } from '@/lib/utils'
import type { OrderStatus } from '../../api/generated/prisma/enums'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
  size?: 'sm' | 'md'
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  DRAFT: {
    label: '草稿',
    className: 'bg-gray-100 text-gray-800',
  },
  PENDING_CONFIRM: {
    label: '待确认',
    className: 'bg-amber-100 text-amber-800',
  },
  IN_PRODUCTION: {
    label: '生产中',
    className: 'bg-blue-100 text-blue-800',
  },
  READY_TO_SHIP: {
    label: '待发货',
    className: 'bg-indigo-100 text-indigo-800',
  },
  SHIPPED: {
    label: '已发货',
    className: 'bg-teal-100 text-teal-800',
  },
  COMPLETED: {
    label: '已完成',
    className: 'bg-green-100 text-green-800',
  },
  RETURNED: {
    label: '已退回',
    className: 'bg-orange-100 text-orange-800',
  },
  EXCEPTION: {
    label: '异常',
    className: 'bg-red-100 text-red-800',
  },
}

const sizeConfig = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
}

export default function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeConfig[size],
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
