import { useAppStore } from '@/hooks/useAppStore'
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Clock,
    Inbox,
    Package,
    RotateCcw,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLE_LABELS, STATUS_LABELS, type UserRole } from '../../shared/types'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, activities, currentRole, fetchStats, fetchActivities, resetAllData } =
    useAppStore()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchActivities(20)
  }, [fetchStats, fetchActivities])

  const hasOverdueCheckin = stats && stats.overdueCheckin > 0
  const hasOverdueVerify = stats && stats.overdueVerify > 0
  const hasProblems = stats && stats.problemCount > 0
  const hasPriority = hasOverdueCheckin || hasOverdueVerify || hasProblems

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

      {hasPriority && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            今日优先事项
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hasOverdueCheckin && (
              <button
                onClick={() => navigate('/dispatch')}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-800 font-medium">超时未入库</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.overdueCheckin}
                  </p>
                </div>
                <ArrowRight size={16} className="text-red-400 ml-auto shrink-0" />
              </button>
            )}

            {hasOverdueVerify && (
              <button
                onClick={() => navigate('/pickup')}
                className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-800 font-medium">超时未核销</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.overdueVerify}
                  </p>
                </div>
                <ArrowRight size={16} className="text-orange-400 ml-auto shrink-0" />
              </button>
            )}

            {hasProblems && (
              <button
                onClick={() => navigate('/problems')}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-800 font-medium">待处理问题件</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.problemCount}
                  </p>
                </div>
                <ArrowRight size={16} className="text-amber-400 ml-auto shrink-0" />
              </button>
            )}
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
