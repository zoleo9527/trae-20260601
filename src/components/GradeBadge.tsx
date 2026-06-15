import type { Grade } from '@/types'
import { cn } from '@/lib/utils'

const gradeConfig: Record<Grade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'A级', color: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  B: { label: 'B级', color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  C: { label: 'C级', color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  D: { label: 'D级', color: 'text-orange-300', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  scrap: { label: '废机', color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/30' },
}

export default function GradeBadge({ grade, size = 'sm' }: { grade: Grade; size?: 'xs' | 'sm' | 'lg' }) {
  const config = gradeConfig[grade]
  const sizeCls =
    size === 'xs' ? 'px-1.5 py-0 text-[10px]' :
    size === 'sm' ? 'px-2 py-0.5 text-xs' :
    'px-3 py-1 text-sm'
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded border',
        config.bg,
        config.color,
        config.border,
        sizeCls
      )}
    >
      {config.label}
    </span>
  )
}
