import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color: string
  compact?: boolean
}

export default function StatCard({ label, value, icon, color, compact }: StatCardProps) {
  if (compact) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-lg p-3 flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold font-mono text-gray-100 leading-none">{value}</div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">{label}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold font-mono text-gray-100">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  )
}
