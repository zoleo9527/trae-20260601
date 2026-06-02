import { useStore } from '@/store/useStore'
import type { Notification, NotificationType } from '@/types'
import { fmtDateTime, fmtRelative } from '@/utils/time'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CheckCheck,
  Filter,
  Search,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const typeMap: Record<NotificationType, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  approval: { label: '审批通过', icon: CheckCircle, color: 'text-emerald-400', dot: 'bg-emerald-500' },
  rejection: { label: '审批驳回', icon: XCircle, color: 'text-red-400', dot: 'bg-red-500' },
  postpone: { label: '顺延调整', icon: Clock, color: 'text-yellow-400', dot: 'bg-yellow-500' },
  cancel: { label: '预约取消', icon: XCircle, color: 'text-zinc-400', dot: 'bg-zinc-500' },
  downtime: { label: '故障停机', icon: AlertTriangle, color: 'text-red-400', dot: 'bg-red-500' },
  restore: { label: '恢复运行', icon: CheckCircle, color: 'text-emerald-400', dot: 'bg-emerald-500' },
}

const TYPE_FILTERS: { label: string; value: NotificationType | null }[] = [
  { label: '全部', value: null },
  { label: '审批通过', value: 'approval' },
  { label: '审批驳回', value: 'rejection' },
  { label: '顺延调整', value: 'postpone' },
  { label: '预约取消', value: 'cancel' },
  { label: '故障停机', value: 'downtime' },
  { label: '恢复运行', value: 'restore' },
]

export default function NotificationsPage() {
  const {
    notifications,
    instruments,
    currentRole,
    currentUserId,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore()

  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const getInstrumentName = (id: string) =>
    instruments.find((i) => i.id === id)?.name || id

  const filtered = useMemo(() => {
    let list = [...notifications]

    if (currentRole === 'student') {
      list = list.filter((n) => n.recipientId === currentUserId || n.recipientId === '')
    } else if (currentRole === 'leader') {
      list = list.filter((n) => n.recipientId === currentUserId || n.recipientId === '')
    }

    if (typeFilter) {
      list = list.filter((n) => n.type === typeFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((n) =>
        n.message.toLowerCase().includes(q) ||
        n.recipientName.toLowerCase().includes(q) ||
        getInstrumentName(n.instrumentId).toLowerCase().includes(q)
      )
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [notifications, typeFilter, searchQuery, currentRole, currentUserId, instruments])

  const unreadCount = notifications.filter((n) => !n.read).length

  const groupByDate = (items: Notification[]) => {
    const groups: Record<string, Notification[]> = {}
    for (const item of items) {
      const date = fmtDateTime(item.createdAt).split(' ')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    }
    return groups
  }

  const grouped = groupByDate(filtered)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">通知记录</h2>
          <p className="text-xs text-zinc-500 mt-1">
            所有状态变更自动记录，按时间线展示
          </p>
        </div>
        {currentRole === 'admin' && unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12122a] border border-[#1e1e3a] rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <CheckCheck size={14} />
            全部标记已读
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-[#12122a] rounded p-0.5 flex-wrap">
          {TYPE_FILTERS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setTypeFilter(tab.value)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索通知内容"
            className="w-full bg-[#12122a] border border-[#1e1e3a] rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          <Filter size={48} className="mx-auto mb-3 opacity-40" />
          暂无通知记录
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="text-xs text-zinc-500 font-medium mb-3 sticky top-0 bg-[#0f0f1a] py-1">
                {date}
              </div>
              <div className="relative pl-6 border-l border-[#1e1e3a] space-y-3">
                {items.map((n) => {
                  const info = typeMap[n.type]
                  const Icon = info.icon
                  return (
                    <div
                      key={n.id}
                      className={`relative rounded border p-3 transition-colors ${
                        n.read
                          ? 'bg-[#0f0f1a]/50 border-[#1e1e3a]'
                          : 'bg-[#12122a] border-indigo-900/40'
                      } hover:bg-[#16162e]`}
                      onClick={() => {
                        if (!n.read && currentRole === 'admin') {
                          markNotificationRead(n.id)
                        }
                      }}
                    >
                      <div
                        className={`absolute -left-[7px] top-4 w-3 h-3 rounded-full border-2 border-[#0f0f1a] ${info.dot}`}
                      />
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 ${info.color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium ${info.color}`}>
                              {info.label}
                            </span>
                            {!n.read && (
                              <span className="text-[10px] text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                                新
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500">
                            <span>{fmtRelative(n.createdAt)}</span>
                            <span>·</span>
                            <span>{getInstrumentName(n.instrumentId)}</span>
                            {n.recipientName && n.recipientName !== '全部' && (
                              <>
                                <span>·</span>
                                <span>接收：{n.recipientName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
