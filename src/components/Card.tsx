import { type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  actions?: ReactNode
  noPadding?: boolean
}

export default function Card({
  title,
  subtitle,
  children,
  className,
  headerClassName,
  bodyClassName,
  actions,
  noPadding = false,
}: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {(title || actions) && (
        <div
          className={cn(
            'flex items-center justify-between px-6 py-4 border-b border-gray-200',
            headerClassName
          )}
        >
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'px-6 py-4', bodyClassName)}>{children}</div>
    </div>
  )
}