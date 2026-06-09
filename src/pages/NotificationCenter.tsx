import { useEffect } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { NOTIFICATION_TYPE_LABELS, type NotificationType } from '../../shared/types'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotificationCenter() {
  const { notifications, unreadCount, loadNotifications, markNotificationRead, markAllRead, localLogs } = useAppStore()

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">异常提醒</h2>
          <p className="text-sm text-slate-500 mt-1">问题件变更、客户联系、复核等触发通知（本地记录体现）</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" /> 全部已读
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">通知列表 ({unreadCount} 条未读)</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 ${n.isRead ? 'opacity-60' : 'bg-blue-50/50'}`}
                >
                  <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-800">{n.title}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                        {NOTIFICATION_TYPE_LABELS[n.type as NotificationType] || n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.createdAt}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      <Check className="w-3 h-3" /> 已读
                    </button>
                  )}
                  {n.sourceType === 'problem' && (
                    <Link
                      to={`/problems/${n.sourceId}`}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      查看
                    </Link>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">暂无通知</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">操作日志（本地记录）</h3>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {localLogs.length > 0 ? (
                <div className="space-y-1.5">
                  {localLogs.map((log, i) => (
                    <p key={i} className="text-xs text-slate-600 font-mono">{log}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">暂无操作记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
