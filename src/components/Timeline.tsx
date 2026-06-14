import type { OperationLog } from '@/types'
import { formatDateTime } from '@/utils/format'
import {
  ClipboardCheck, CalendarClock, UserCheck, AlertTriangle, CheckCircle2, XCircle,
  FileUp, RotateCcw, CalendarX, Wrench, FileQuestion, RefreshCcw, HandCoins,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '检测完成': CheckCircle2,
  '创建整改任务': ClipboardCheck,
  '提交整改材料': FileUp,
  '补录整改材料': RefreshCcw,
  '审核通过': CheckCircle2,
  '驳回整改': XCircle,
  '生成复检待办': Wrench,
  '安排复检': CalendarClock,
  '改排复检': RotateCcw,
  '取消复检安排': CalendarX,
  '复检完成': UserCheck,
  '复检异常': AlertTriangle,
  '处理复检异常': HandCoins,
}

const colorMap: Record<string, string> = {
  '检测完成': 'text-info-400 border-info-500/40 bg-info-500/10',
  '创建整改任务': 'text-warn-400 border-warn-500/40 bg-warn-500/10',
  '提交整改材料': 'text-ink-200 border-ink-400/40 bg-ink-500/20',
  '补录整改材料': 'text-warn-400 border-warn-500/40 bg-warn-500/10',
  '审核通过': 'text-safe-400 border-safe-500/40 bg-safe-500/10',
  '驳回整改': 'text-danger-400 border-danger-500/40 bg-danger-500/10',
  '生成复检待办': 'text-info-400 border-info-500/40 bg-info-500/10',
  '安排复检': 'text-info-400 border-info-500/40 bg-info-500/10',
  '改排复检': 'text-warn-400 border-warn-500/40 bg-warn-500/10',
  '取消复检安排': 'text-danger-400 border-danger-500/40 bg-danger-500/10',
  '复检完成': 'text-safe-400 border-safe-500/40 bg-safe-500/10',
  '复检异常': 'text-danger-400 border-danger-500/40 bg-danger-500/10',
  '处理复检异常': 'text-warn-400 border-warn-500/40 bg-warn-500/10',
}

export default function Timeline({ logs, maxItems }: { logs: OperationLog[]; maxItems?: number }) {
  const list = maxItems ? logs.slice(0, maxItems) : logs
  if (list.length === 0) {
    return <div className="text-xs text-ink-400 py-6 text-center">暂无操作记录</div>
  }
  return (
    <ol className="relative">
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-ink-600" />
      {list.map(log => {
        const Icon = iconMap[log.action] || FileQuestion
        return (
          <li key={log.id} className="relative pl-8 pb-3 last:pb-0">
            <span className={`absolute left-0 top-0.5 w-[22px] h-[22px] rounded-sm flex items-center justify-center border ${colorMap[log.action] || 'text-ink-300 border-ink-500 bg-ink-700'}`}>
              <Icon className="w-3 h-3" />
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs text-ink-100 font-medium">{log.action}</span>
              <span className="text-[10px] text-ink-400">{log.operatorName} · {log.operatorRoleLabel}</span>
            </div>
            <div className="text-[11px] text-ink-300 mt-0.5 leading-relaxed">{log.content}</div>
            <div className="text-[10px] text-ink-500 mt-0.5 font-mono">{formatDateTime(log.timestamp)}</div>
          </li>
        )
      })}
    </ol>
  )
}
