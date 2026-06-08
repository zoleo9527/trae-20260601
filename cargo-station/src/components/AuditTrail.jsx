import { useMemo } from 'react'

const ACTION_LABELS = {
  create: { label: '创建托运', color: 'bg-blue-500' },
  review_start: { label: '开始复核', color: 'bg-yellow-500' },
  review_approve: { label: '复核通过', color: 'bg-green-500' },
  review_reject: { label: '复核退回', color: 'bg-red-500' },
  supplement: { label: '补交资料', color: 'bg-purple-500' },
  return: { label: '退回货主', color: 'bg-red-600' },
}

export default function AuditTrail({ traceData }) {
  const sortedLogs = useMemo(() => {
    if (!traceData?.traceItems) return []
    return [...traceData.traceItems].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }, [traceData])

  if (!traceData) return null

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-800 mb-4">操作追溯与退回溯源</h3>

      <div className="space-y-0">
        {sortedLogs.map((log, i) => {
          const action = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-slate-400' }
          const isLast = i === sortedLogs.length - 1

          return (
            <div key={log.id || i} className="relative pl-8 pb-4">
              {!isLast && (
                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
              )}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${action.color} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>

              <div className="ml-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">{action.label}</span>
                  <span className="text-xs text-slate-400">
                    {log.operator}（{log.role}）
                  </span>
                  <span className="text-xs text-slate-300">
                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{log.detail}</p>

                {log.traceFrom && (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">退回溯源</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-red-50 rounded p-2">
                        <p className="text-xs text-red-500 font-medium mb-1">{log.traceFrom.type}</p>
                        <p className="text-sm text-red-800">{log.traceFrom.detail}</p>
                      </div>
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-xs text-blue-500 font-medium mb-1">{log.traceTo.type}</p>
                        <p className="text-sm text-blue-800">{log.traceTo.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <span className="text-xs text-slate-400">复核退回 ──指向──▶ 原始托运资料</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sortedLogs.length === 0 && (
        <div className="text-sm text-slate-400 text-center py-4">暂无操作记录</div>
      )}
    </div>
  )
}
