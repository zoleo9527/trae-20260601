import { cn } from '@/utils/helpers'
import { RiskLevel, RiskLevelLabels } from '@/types/types'

interface RiskBadgeProps {
  level: RiskLevel
  reasons?: string[]
  showReasons?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function RiskBadge({ level, reasons = [], showReasons = false, size = 'md' }: RiskBadgeProps) {
  const colorClasses = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    none: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  const iconClasses = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    none: '⚪',
  }

  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border font-medium',
          colorClasses[level],
          sizeClasses[size]
        )}
      >
        <span>{iconClasses[level]}</span>
        <span>{RiskLevelLabels[level]}</span>
      </span>
      {showReasons && reasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {reasons.map((reason, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded text-gray-600"
            >
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}