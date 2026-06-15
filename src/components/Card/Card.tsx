import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  highlight?: boolean
  warning?: boolean
}

export function Card({ children, className, onClick, highlight, warning }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        highlight && 'border-2 border-blue-500',
        warning && 'border-2 border-orange-500 animate-pulse',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: 'blue' | 'orange' | 'green' | 'red'
}

export function CardHeader({ title, subtitle, badge, badgeColor }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {badge && (
        <span className={clsx(
          'px-2 py-1 rounded text-xs font-medium',
          badgeColor === 'blue' && 'bg-blue-100 text-blue-700',
          badgeColor === 'orange' && 'bg-orange-100 text-orange-700',
          badgeColor === 'green' && 'bg-green-100 text-green-700',
          badgeColor === 'red' && 'bg-red-100 text-red-700',
        )}>
          {badge}
        </span>
      )}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
}

export function CardContent({ children }: CardContentProps) {
  return <div className="text-gray-700">{children}</div>
}