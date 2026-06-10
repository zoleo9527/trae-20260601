import { useMemo } from 'react'
import { Wheat, User, Clock } from 'lucide-react'
import { mockFeedLogs, mockBatches } from '@/data/mock'
import { cn } from '@/lib/utils'

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FeedLogs() {
  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof mockFeedLogs> = {}
    for (const log of mockFeedLogs) {
      if (!groups[log.batchId]) {
        groups[log.batchId] = []
      }
      groups[log.batchId].push(log)
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
    return groups
  }, [])

  const batchMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of mockBatches) {
      map[b.id] = b.batchNo
    }
    return map
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">投料记录</h1>

      <div className="space-y-6">
        {Object.entries(groupedLogs).map(([batchId, logs]) => (
          <div key={batchId} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Wheat size={16} className="text-amber-600" />
              <span className="text-sm font-semibold text-slate-900">
                {batchMap[batchId] || batchId}
              </span>
              <span className="text-xs text-slate-400">({logs.length} 条记录)</span>
            </div>

            <div className="relative px-4 py-3">
              {logs.map((log, index) => (
                <div key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0 mt-1.5',
                      index === logs.length - 1 ? 'bg-amber-400' : 'bg-slate-300'
                    )} />
                    {index < logs.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{log.material}</p>
                      <span className="text-sm font-semibold text-slate-700">{log.weight}kg</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {log.operator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
