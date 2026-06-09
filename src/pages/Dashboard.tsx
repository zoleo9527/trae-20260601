import { useNavigate } from 'react-router-dom'
import { AlertTriangle, AlertCircle, Info, Plus, Clock, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useWarningStore } from '@/stores/warningStore'
import { useExchangeStore } from '@/stores/exchangeStore'
import { useRecentStore } from '@/stores/recentStore'
import { WARNING_STATUS_LABELS, EXCHANGE_STATUS_LABELS } from '@/types'
import type { Urgency, Warning, Exchange } from '@/types'

const URGENCY_CONFIG: Record<Urgency, {
  label: string
  icon: React.ReactNode
  gradient: string
  border: string
  textColor: string
  dotColor: string
}> = {
  critical: {
    label: '7天内到期',
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    gradient: 'bg-gradient-to-br from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    textColor: 'text-red-400',
    dotColor: 'bg-red-400',
  },
  urgent: {
    label: '30天内到期',
    icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
    gradient: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
  normal: {
    label: '90天内到期',
    icon: <Info className="w-5 h-5 text-blue-400" />,
    gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
}

interface TaskItem {
  id: string
  type: 'warning' | 'exchange'
  productName: string
  batchNo: string
  urgency: Urgency
  statusLabel: string
  path: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const warnings = useWarningStore((s) => s.warnings)
  const exchanges = useExchangeStore((s) => s.exchanges)
  const getByUser = useRecentStore((s) => s.getByUser)

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const criticalCount = warnings.filter((w) => w.urgency === 'critical').length
  const urgentCount = warnings.filter((w) => w.urgency === 'urgent').length
  const normalCount = warnings.filter((w) => w.urgency === 'normal').length

  const warningMap = new Map<string, Warning>()
  warnings.forEach((w) => warningMap.set(w.id, w))

  const pendingTasks: TaskItem[] = []

  if (currentUser) {
    const role = currentUser.role

    if (role === 'sales') {
      warnings
        .filter((w) => w.status === 'rejected')
        .forEach((w) => {
          pendingTasks.push({
            id: w.id,
            type: 'warning',
            productName: w.productName,
            batchNo: w.batchNo,
            urgency: w.urgency,
            statusLabel: '需要重新提交',
            path: `/warnings/${w.id}`,
          })
        })
      exchanges
        .filter((e) => e.status === 'completed')
        .forEach((e) => {
          const w = warningMap.get(e.warningId)
          pendingTasks.push({
            id: e.id,
            type: 'exchange',
            productName: w?.productName ?? '未知耗材',
            batchNo: w?.batchNo ?? '',
            urgency: w?.urgency ?? 'normal',
            statusLabel: '可补录',
            path: `/exchanges/${e.id}`,
          })
        })
    }

    if (role === 'warehouse') {
      warnings
        .filter((w) => w.status === 'pending')
        .forEach((w) => {
          pendingTasks.push({
            id: w.id,
            type: 'warning',
            productName: w.productName,
            batchNo: w.batchNo,
            urgency: w.urgency,
            statusLabel: WARNING_STATUS_LABELS[w.status],
            path: `/warnings/${w.id}`,
          })
        })
      exchanges
        .filter((e) => e.status === 'rejected')
        .forEach((e) => {
          const w = warningMap.get(e.warningId)
          pendingTasks.push({
            id: e.id,
            type: 'exchange',
            productName: w?.productName ?? '未知耗材',
            batchNo: w?.batchNo ?? '',
            urgency: w?.urgency ?? 'normal',
            statusLabel: '需要重新提交',
            path: `/exchanges/${e.id}`,
          })
        })
    }

    if (role === 'aftersales') {
      exchanges
        .filter((e) => e.status === 'pending')
        .forEach((e) => {
          const w = warningMap.get(e.warningId)
          pendingTasks.push({
            id: e.id,
            type: 'exchange',
            productName: w?.productName ?? '未知耗材',
            batchNo: w?.batchNo ?? '',
            urgency: w?.urgency ?? 'normal',
            statusLabel: '待审核',
            path: `/exchanges/${e.id}`,
          })
        })
      exchanges
        .filter((e) => e.status === 'approved')
        .forEach((e) => {
          const w = warningMap.get(e.warningId)
          pendingTasks.push({
            id: e.id,
            type: 'exchange',
            productName: w?.productName ?? '未知耗材',
            batchNo: w?.batchNo ?? '',
            urgency: w?.urgency ?? 'normal',
            statusLabel: '待填写结果',
            path: `/exchanges/${e.id}`,
          })
        })
    }
  }

  const recentItems = currentUser ? getByUser(currentUser.id) : []

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">工作台</h1>
          <span className="text-sm text-slate-400">{dateStr}</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(['critical', 'urgent', 'normal'] as Urgency[]).map((urgency) => {
            const config = URGENCY_CONFIG[urgency]
            const count = urgency === 'critical' ? criticalCount : urgency === 'urgent' ? urgentCount : normalCount
            return (
              <div
                key={urgency}
                className={`rounded-xl border p-5 ${config.gradient} ${config.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {config.icon}
                  <span className="text-sm text-slate-300">{config.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${config.textColor}`}>{count}</span>
                  <span className="text-sm text-slate-400">件耗材</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">待处理任务</h2>
            {pendingTasks.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-full">
                {pendingTasks.length}
              </span>
            )}
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">暂无待处理任务</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const config = URGENCY_CONFIG[task.urgency]
                return (
                  <div
                    key={`${task.type}-${task.id}`}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg border border-slate-700/50 px-4 py-3 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                      <div>
                        <span className="text-sm text-white">{task.productName}</span>
                        <span className="text-xs text-slate-400 ml-2">{task.batchNo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {task.statusLabel}
                      </span>
                      <button
                        onClick={() => navigate(task.path)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        查看
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {currentUser?.role === 'sales' && (
            <button
              onClick={() => navigate('/warnings/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              提交预警
            </button>
          )}
          {currentUser?.role === 'warehouse' && (
            <button
              onClick={() => navigate('/exchanges')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              提交换货
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            查看历史
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">最近打开</h2>
          {recentItems.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">暂无记录</p>
          ) : (
            <div className="space-y-2">
              {recentItems.map((item) => {
                const icon =
                  item.itemType === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  )
                const path =
                  item.itemType === 'warning'
                    ? `/warnings/${item.itemId}`
                    : `/exchanges/${item.itemId}`
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
                    </div>
                    <span className="text-xs text-slate-500">{time}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
