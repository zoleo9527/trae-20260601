import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle, ArrowRight, Wrench, RotateCcw } from 'lucide-react'

const actionIcons: Record<string, React.ReactNode> = {
  created: <Circle size={14} className="text-blue-400" />,
  accepted: <CheckCircle size={14} className="text-yellow-400" />,
  completed: <CheckCircle size={14} className="text-emerald-400" />,
  clean_completed: <CheckCircle size={14} className="text-emerald-400" />,
  approved: <CheckCircle size={14} className="text-emerald-400" />,
  rejected: <XCircle size={14} className="text-red-400" />,
  cancelled: <XCircle size={14} className="text-gray-400" />,
}

const actionLabels: Record<string, string> = {
  created: '创建',
  accepted: '接单',
  completed: '完成',
  clean_completed: '保洁完成',
  approved: '审核通过',
  rejected: '审核驳回',
  cancelled: '取消',
}

interface TimelineEntry {
  action: string
  operator_name: string
  note?: string | null
  created_at: string
}

export function Timeline({ entries, type = 'repair' }: { entries: TimelineEntry[]; type?: 'repair' | 'recovery' }) {
  if (!entries.length) {
    return <div className="text-[#6b7084] text-sm py-4 text-center">暂无操作记录</div>
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => {
        const icon = actionIcons[entry.action] || <Circle size={14} className="text-gray-400" />
        const label = actionLabels[entry.action] || entry.action
        const isLast = i === entries.length - 1

        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#1a1d28] border border-[#2a2f42] flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-[#2a2f42] my-1" />}
            </div>
            <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#e4e6eb]">{label}</span>
                <span className="text-[11px] text-[#6b7084]">{entry.operator_name}</span>
              </div>
              {entry.note && (
                <div className="text-[12px] text-[#8b8fa3] mt-0.5">{entry.note}</div>
              )}
              <div className="text-[11px] text-[#4a4e5e] mt-0.5">{formatTime(entry.created_at)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatTime(dateStr: string) {
  if (!dateStr || dateStr.startsWith('datetime')) return '--'
  try {
    const d = new Date(dateStr + 'Z')
    if (isNaN(d.getTime())) return dateStr
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return dateStr
  }
}

export { formatTime }
