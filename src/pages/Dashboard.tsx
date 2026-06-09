import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Archive,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Layers,
  TrendingUp,
  FileCheck,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import type { DashboardData, RecentItem, AppNotification } from '@/lib/types'
import { ROLE_LABELS, CONTRACT_STATUS_LABELS, ARCHIVE_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const TODO_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; link: string }> = {
  pending_review: { label: '待审核签约', icon: ClipboardCheck, color: 'text-amber-600 bg-amber-50', link: '/contracts?status=pending_review' },
  returned: { label: '退回待补录', icon: RotateCcw, color: 'text-red-600 bg-red-50', link: '/contracts?status=returned' },
  pending: { label: '待处理建档', icon: Archive, color: 'text-amber-600 bg-amber-50', link: '/archives?status=pending' },
  processing: { label: '处理中建档', icon: FileCheck, color: 'text-blue-600 bg-blue-50', link: '/archives?status=processing' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentRole, currentUser, notifications, markNotificationRead } = useAppStore()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [dash, recent] = await Promise.all([
          api.dashboard.get(currentRole),
          api.recent.list(currentUser),
        ])
        setDashboard(dash)
        setRecentItems(recent)
      } catch {
        setDashboard(null)
        setRecentItems([])
      }
      setLoading(false)
    }
    load()
  }, [currentRole, currentUser])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse p-5">
            <div className="h-5 w-32 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    )
  }

  const todoEntries = dashboard?.todoCount
    ? Object.entries(dashboard.todoCount).filter(([, cnt]) => cnt > 0)
    : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {currentUser}的工作台
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            当前角色：{ROLE_LABELS[currentRole]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/contracts/new" className="btn-primary">
            <Plus size={14} />
            创建签约
          </Link>
          <Link to="/batch" className="btn-secondary">
            <Layers size={14} />
            批量录入
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {dashboard?.stats && (
          <>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">{dashboard.stats.totalContracts}</div>
                  <div className="text-xs text-zinc-500">签约总数</div>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Archive size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">{dashboard.stats.totalArchives}</div>
                  <div className="text-xs text-zinc-500">建档总数</div>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">{dashboard.stats.completionRate}%</div>
                  <div className="text-xs text-zinc-500">建档完成率</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {todoEntries.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">待办事项</h3>
          <div className="grid grid-cols-2 gap-3">
            {todoEntries.map(([key, count]) => {
              const cfg = TODO_CONFIG[key]
              if (!cfg) return null
              const Icon = cfg.icon
              return (
                <Link
                  key={key}
                  to={cfg.link}
                  className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 transition-all hover:border-zinc-200 hover:shadow-sm"
                >
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', cfg.color)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-800">{cfg.label}</div>
                  </div>
                  <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-xs font-bold text-white">
                    {count}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-700">变更通知</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-zinc-400">{notifications.filter((n) => n.is_read === 0).length} 条未读</span>
            )}
          </div>
          <div className="divide-y divide-zinc-50 max-h-80 overflow-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <AlertTriangle size={24} className="mb-2 opacity-30" />
                <p className="text-xs">暂无通知</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((n: AppNotification) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    n.is_read === 0 ? 'bg-primary-50/30' : 'bg-white',
                    n.is_read === 0 && 'cursor-pointer hover:bg-primary-50/50'
                  )}
                  onClick={async () => {
                    if (n.is_read === 0) {
                      await markNotificationRead(n.id)
                    }
                    if (n.archive_id) {
                      navigate(`/archives/${n.archive_id}`)
                    } else {
                      navigate(`/contracts/${n.contract_id}`)
                    }
                  }}
                >
                  <div className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs',
                    n.type === 'contract_changed' && 'bg-amber-100 text-amber-700',
                    n.type === 'contract_returned' && 'bg-red-100 text-red-700',
                    n.type === 'archive_return' && 'bg-red-100 text-red-700',
                    n.type === 'archive_completed' && 'bg-emerald-100 text-emerald-700',
                  )}>
                    {n.type === 'archive_completed' ? <FileCheck size={12} /> : <AlertTriangle size={12} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-medium', n.is_read === 0 ? 'text-zinc-900' : 'text-zinc-500')}>
                        {n.title}
                      </span>
                      {n.is_read === 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{n.summary}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {n.resident_name && <span>{n.resident_name} · </span>}
                      {new Date(n.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-2 card">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-700">最近打开</h3>
            <Link to="/contracts" className="btn-ghost text-xs">
              查看全部
              <ArrowRight size={10} />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50 max-h-80 overflow-auto scrollbar-thin">
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <Clock size={24} className="mb-2 opacity-30" />
                <p className="text-xs">暂无记录</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/contracts/${item.item_id}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                    <FileText size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-zinc-700 truncate">{item.resident_name}</div>
                    <div className="text-[10px] text-zinc-400">{item.contract_no}</div>
                  </div>
                  <span className={cn('badge', `badge-${item.status}`)}>
                    {CONTRACT_STATUS_LABELS[item.status as keyof typeof CONTRACT_STATUS_LABELS] || item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
