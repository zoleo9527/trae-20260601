import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { useRecentStore } from '@/stores/recentStore'
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react'

export default function Recent() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const getByUser = useRecentStore((s) => s.getByUser)

  const recentItems = currentUser ? getByUser(currentUser.id) : []

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">最近打开</h1>
          {recentItems.length > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-full">
              {recentItems.length}
            </span>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">暂无最近打开的记录</p>
            <p className="text-slate-600 text-sm mt-1">查看预警或换货详情时会自动记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentItems.map((item) => {
              const isWarning = item.itemType === 'warning'
              const path = isWarning
                ? `/warnings/${item.itemId}`
                : `/exchanges/${item.itemId}`
              const icon = isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ArrowRight className="w-4 h-4 text-blue-400" />
              )
              const typeLabel = isWarning ? '预警' : '换货'
              const typeBadgeClass = isWarning
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
              const time = new Date(item.accessedAt).toLocaleString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(path)}
                  className="flex items-center justify-between bg-slate-800/50 rounded-lg border border-slate-700/50 px-4 py-3 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm text-white">{item.itemTitle}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${typeBadgeClass}`}>
                      {typeLabel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{time}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
