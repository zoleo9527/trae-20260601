import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeColor = 'success' | 'warning' | 'danger' | 'info' | 'primary'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color = 'primary', children, ...props }, ref) => {
    const colors: Record<BadgeColor, string> = {
      success: 'bg-success-100 text-success-700 border-success-200',
      warning: 'bg-warning-100 text-warning-700 border-warning-200',
      danger: 'bg-warning-100 text-warning-700 border-warning-200',
      info: 'bg-info-100 text-info-700 border-info-200',
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border',
          colors[color],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
