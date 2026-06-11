import type { ApplicationLog, ApprovalLog } from '../types'
import { ACTION_LABEL_MAP } from '../types'

interface TimelineProps {
  logs: (ApplicationLog | ApprovalLog)[]
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-amber-400',
  processed: 'bg-blue-400',
  returned: 'bg-red-400',
  supplemented: 'bg-emerald-400',
  closed: 'bg-zinc-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-red-400',
}

export default function Timeline({ logs }: TimelineProps) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-zinc-400 py-4">暂无流转记录</p>
  }

  return (
    <div className="relative">
      {logs.map((log, index) => (
        <div key={log.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${ACTION_COLORS[log.action] || 'bg-zinc-300'}`}
            />
            {index < logs.length - 1 && <div className="w-0.5 flex-1 bg-zinc-200 mt-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-800">
                {ACTION_LABEL_MAP[log.action] || log.action}
              </span>
              <span className="text-xs text-slate-500">{log.operator}</span>
              <span className="text-xs text-slate-400">{log.createdAt}</span>
            </div>
            {log.remark && (
              <p className="text-sm text-slate-600 mt-1">{log.remark}</p>
            )}
            {log.handover && (
              <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-md">
                <span className="text-xs text-amber-600 font-medium">交接备注：</span>
                <span className="text-xs text-amber-800">{log.handover}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
