import { cn } from '@/lib/utils'
import { roleConfig } from '@/store'
import type { Role } from '@/types'

interface TimelineEntry {
  id: string
  action: string
  operator: string
  role: Role
  note: string | null
  created_at: string
}

const actionLabels: Record<string, string> = {
  create: '创建',
  submit: '提交',
  approve: '审核通过',
  reject: '驳回',
  confirm_out: '确认出库',
  ship: '发货',
  complete: '签收完成',
  qualification_warning: '资质预警',
  qualification_info: '资质提醒',
}

const actionColors: Record<string, string> = {
  create: 'bg-gray-400',
  submit: 'bg-blue-500',
  approve: 'bg-green-500',
  reject: 'bg-red-500',
  confirm_out: 'bg-teal-500',
  ship: 'bg-indigo-500',
  complete: 'bg-emerald-500',
  qualification_warning: 'bg-amber-500',
  qualification_info: 'bg-amber-400',
}

const actionBorderColors: Record<string, string> = {
  create: 'border-gray-300',
  submit: 'border-blue-300',
  approve: 'border-green-300',
  reject: 'border-red-300',
  confirm_out: 'border-teal-300',
  ship: 'border-indigo-300',
  complete: 'border-emerald-300',
  qualification_warning: 'border-amber-300',
  qualification_info: 'border-amber-200',
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

interface TimelineProps {
  entries: TimelineEntry[]
  className?: string
}

export default function Timeline({ entries, className }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">暂无操作记录</div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1
        const dotColor = actionColors[entry.action] || 'bg-gray-400'
        const borderColor = actionBorderColors[entry.action] || 'border-gray-300'
        const label = actionLabels[entry.action] || entry.action
        const roleLabel = roleConfig[entry.role]?.label || entry.role

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className={cn('z-10 h-3 w-3 rounded-full ring-2 ring-white', dotColor)} />
              {!isLast && (
                <div className={cn('w-0.5 flex-1 border-l-2', borderColor)} />
              )}
            </div>
            <div className="min-w-0 flex-1 -mt-0.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{label}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{entry.operator}</span>
                <span className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium',
                  entry.role === 'director' && 'bg-amber-50 text-amber-700',
                  entry.role === 'sales_clerk' && 'bg-blue-50 text-blue-700',
                  entry.role === 'warehouse' && 'bg-teal-50 text-teal-700',
                  entry.role === 'after_sales' && 'bg-indigo-50 text-indigo-700',
                )}>
                  {roleLabel}
                </span>
              </div>
              {entry.note && (
                <p className="mt-1 text-xs text-gray-500">{entry.note}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">{formatTime(entry.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
