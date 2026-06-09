import { useAppStore } from '@/hooks/useAppStore'
import { cn } from '@/lib/utils'
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Clock,
    Inbox,
    LogIn,
    Package,
    RotateCcw,
    ShieldAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ROLE_LABELS,
    STATUS_LABELS,
    TYPE_LABELS,
    type PriorityItem,
    type UserRole
} from '../../shared/types'

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  return `${diffDay}天前`
}

const roleBadgeClass: Record<UserRole, string> = {
  dispatcher: 'bg-blue-100 text-blue-700',
  station_manager: 'bg-primary-100 text-primary-700',
  customer_service: 'bg-purple-100 text-purple-700',
}

const PRIORITY_STYLES: Record<number, { bg: string; border: string; icon: React.ElementType; iconBg: string; iconColor: string; text: string; badge: string }> = {
  1: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconBg: 'bg-red-600', iconColor: 'text-white', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
  2: { bg: 'bg-orange-50', border: 'border-orange-200', icon: Clock, iconBg: 'bg-orange-600', iconColor: 'text-white', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  3: { bg: 'bg-amber-50', border: 'border-amber-200', icon: ShieldAlert, iconBg: 'bg-amber-600', iconColor: 'text-white', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  4: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Inbox, iconBg: 'bg-blue-600', iconColor: 'text-white', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  5: { bg: 'bg-teal-50', border: 'border-teal-200', icon: LogIn, iconBg: 'bg-teal-600', iconColor: 'text-white', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' },
}

function getActionRoute(item: PriorityItem): string {
  if (item.status === 'arrived') return '/dispatch'
  if (item.status === 'checked_in' || item.status === 'notified') return '/pickup'
  if (item.status === 'problem') return '/problems'
  return `/package/${item.id}`
}

function getActionLabel(item: PriorityItem): string {
  if (item.status === 'arrived') return '去入库'
  if (item.status === 'checked_in' || item.status === 'notified') return '去核销'
  if (item.status === 'problem') return '去处理'
  return '查看'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, activities, priorityItems, currentRole, fetchStats, fetchActivities, fetchPriorityItems, resetAllData } =
    useAppStore()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchActivities(20)
    fetchPriorityItems(10)
  }, [fetchStats, fetchActivities, fetchPriorityItems])

  const handleReset = async () => {
    setResetting(true)
    await resetAllData()
    setResetting(false)
    setShowResetDialog(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">工作台</h1>
        <p className="text-sm text-zinc-500 mt-1">
          当前角色：{ROLE_LABELS[currentRole]}
        </p>
      </div>

      {priorityItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            今日优先处理
          </h2>
          <div className="space-y-2">
            {priorityItems.map((item) => {
              const style = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES[5]
              const Icon = style.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3.5 transition-colors',
                    style.bg,
                    style.border,
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', style.iconBg)}>
                    <Icon size={18} className={style.iconColor} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-medium', style.badge)}>
                        {item.reason}
                      </span>
                      <span className="text-xs tracking-no text-zinc-500 font-medium">
                        {item.trackingNo}
                      </span>
                      {item.type !== 'normal' && (
                        <span className="text-[10px] text-zinc-400">
                          {TYPE_LABELS[item.type]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>{item.currentHandler}</span>
                      <span className={cn('inline-block px-1 py-0 rounded text-[9px] font-medium', roleBadgeClass[item.currentRole])}>
                        {ROLE_LABELS[item.currentRole]}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span>{formatRelativeTime(item.arrivedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/package/${item.id}`)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => navigate(getActionRoute(item))}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        style.iconBg,
                        style.iconColor,
                        'hover:opacity-90',
                      )}
                    >
                      {getActionLabel(item)}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          统计卡片
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Inbox size={18} className="text-blue-600" />
              </div>
              <span className="text-sm text-zinc-500">待入库</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">
              {stats?.pendingCheckin ?? '-'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                <Package size={18} className="text-teal-600" />
              </div>
              <span className="text-sm text-zinc-500">待核销</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">
              {stats?.pendingVerify ?? '-'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <span className="text-sm text-zinc-500">问题件</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">
              {stats?.problemCount ?? '-'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <span className="text-sm text-zinc-500">今日完成</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">
              {stats?.todayCompleted ?? '-'}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          最近动态
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-100">
          {activities.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">暂无动态</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {activities.map(activity => (
                <li key={activity.id}>
                  <button
                    onClick={() => navigate(`/package/${activity.packageId}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-zinc-800">
                          {activity.operator}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${roleBadgeClass[activity.role]}`}
                        >
                          {ROLE_LABELS[activity.role]}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {STATUS_LABELS[activity.action as keyof typeof STATUS_LABELS] ?? activity.action}
                        </span>
                      </div>
                      <span className="text-xs tracking-no text-zinc-400">
                        {activity.trackingNo}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {currentRole === 'customer_service' && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 bg-white border border-zinc-200 rounded-lg shadow-sm hover:text-zinc-600 hover:border-zinc-300 transition-colors"
          >
            <RotateCcw size={12} />
            重置数据
          </button>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">确认重置数据</h3>
            <p className="text-sm text-zinc-500 mb-5">
              此操作将清空所有包裹和活动数据，且无法恢复。确定要继续吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {resetting ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
