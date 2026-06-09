import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '@/stores/dashboard'
import { problemApi, type ProblemOrder, type CauseChainItem } from '@/lib/api'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, FileCheck, RefreshCw, Timer, Calendar, FileEdit, XCircle } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  misplaced: '错放箱',
  overdue: '超期堆存',
  missed_notify: '查验漏通知',
  detained: '海关扣留',
  stuck_inspecting: '查验停滞',
  stuck_move: '移箱超时',
  expiring_soon: '免堆期预警',
  no_inspection: '无查验计划',
  yard_stagnation: '查验后滞留',
}

const TYPE_COLORS: Record<string, string> = {
  misplaced: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  missed_notify: 'bg-yellow-100 text-yellow-700',
  detained: 'bg-red-100 text-red-700',
  stuck_inspecting: 'bg-amber-100 text-amber-700',
  stuck_move: 'bg-purple-100 text-purple-700',
  expiring_soon: 'bg-blue-100 text-blue-700',
  no_inspection: 'bg-slate-100 text-slate-700',
  yard_stagnation: 'bg-teal-100 text-teal-700',
}

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  rescheduled: '已改期',
  supplemented: '已补录',
  rejected: '已驳回',
  resolved: '已解决',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  rescheduled: 'bg-blue-100 text-blue-700',
  supplemented: 'bg-purple-100 text-purple-700',
  rejected: 'bg-slate-100 text-slate-500',
  resolved: 'bg-green-100 text-green-700',
}

function parseCauseChain(raw: string | undefined | null): CauseChainItem[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default function ServiceDashboard() {
  const { data, fetchDashboard } = useDashboardStore()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [recentHandled, setRecentHandled] = useState<ProblemOrder[]>([])
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchDashboard('service')
    } catch {} finally {
      setRefreshing(false)
    }
  }, [fetchDashboard])

  const loadRecentHandled = useCallback(async () => {
    try {
      const results = await Promise.all([
        problemApi.list({ status: 'rescheduled' }),
        problemApi.list({ status: 'supplemented' }),
        problemApi.list({ status: 'rejected' }),
      ])
      const merged = [...results[0], ...results[1], ...results[2]]
      merged.sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return tb - ta
      })
      setRecentHandled(merged.slice(0, 10))
    } catch {}
  }, [])

  useEffect(() => {
    load()
    loadRecentHandled()
    timerRef.current = setInterval(load, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [load, loadRecentHandled])

  const criticalCount = (data?.pendingActions?.criticalCount as number) ?? 0
  const warningCount = (data?.pendingActions?.warningCount as number) ?? 0
  const openByType = (data?.pendingActions?.openByType ?? {}) as Record<string, number>
  const openBySeverity = (data?.pendingActions?.openBySeverity ?? {}) as Record<string, number>

  const stats = [
    { label: '今日进场', value: data?.todayStats.entered ?? 0, icon: <ArrowDownToLine size={20} className="text-portBlue" />, color: 'bg-portBlue/10' },
    { label: '今日出场', value: data?.todayStats.exited ?? 0, icon: <ArrowUpFromLine size={20} className="text-green-600" />, color: 'bg-green-50' },
    { label: '今日查验', value: data?.todayStats.inspections ?? 0, icon: <FileCheck size={20} className="text-portOrange" />, color: 'bg-orange-50' },
    { label: '待处理问题单', value: data?.pendingCount ?? 0, icon: <AlertTriangle size={20} className="text-red-500" />, color: 'bg-red-50' },
  ]

  const typeBreakdown = data?.typeBreakdown ?? {}
  const breakdownParts = Object.entries(typeBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${TYPE_LABELS[k] ?? k}${v}`)
    .join('/')

  const handleQuickAction = async (orderId: number, action: 'reschedule' | 'supplement' | 'reject') => {
    setActionLoading(orderId)
    try {
      const actionData: Record<string, unknown> = {}
      if (action === 'reschedule') {
        actionData.planned_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      await problemApi.takeAction(orderId, { action, data: actionData, remark: '工作台快捷操作' })
      await load()
      await loadRecentHandled()
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-portNavy">客户服务工作台</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-1 text-portBlue hover:text-portOrange disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            刷新
          </button>
          {data?.lastDetectedAt && (
            <span>上次检测: {data.lastDetectedAt.slice(11, 16)}</span>
          )}
        </div>
      </div>

      {criticalCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <div className="flex-1">
              <span className="font-bold text-red-700">{criticalCount} 条严重卡住单据</span>
              {breakdownParts && <span className="text-red-500 text-sm ml-2">({breakdownParts})</span>}
            </div>
            <button
              onClick={() => navigate('/service/problems')}
              className="text-red-600 text-sm font-medium hover:text-red-700"
            >
              查看详情 →
            </button>
          </div>
        </div>
      )}

      {warningCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Timer size={20} className="text-amber-500" />
            <div className="flex-1">
              <span className="font-bold text-amber-700">{warningCount} 条预警单据</span>
              <span className="text-amber-500 text-sm ml-2">需要关注</span>
            </div>
            <button
              onClick={() => navigate('/service/problems')}
              className="text-amber-600 text-sm font-medium hover:text-amber-700"
            >
              查看详情 →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-portNavy">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-100 p-5">
          <h3 className="font-bold text-portNavy mb-3">问题单分类统计</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(openByType).length === 0 ? (
              <span className="text-sm text-slate-400">暂无分类数据</span>
            ) : (
              Object.entries(openByType)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => (
                  <span
                    key={type}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {TYPE_LABELS[type] || type} <span className="font-bold">{count as number}</span>
                  </span>
                ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-100 p-5">
          <h3 className="font-bold text-portNavy mb-3">严重等级分布</h3>
          <div className="flex gap-4">
            {Object.entries(openBySeverity).length === 0 ? (
              <span className="text-sm text-slate-400">暂无等级数据</span>
            ) : (
              Object.entries(openBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex-1">
                  <div
                    className={`rounded-lg p-4 text-center ${
                      severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <div className={`text-3xl font-bold ${severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                      {count as number}
                    </div>
                    <div className={`text-sm mt-1 ${severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                      {severity === 'critical' ? '严重' : '预警'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-100 mb-6">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-portNavy">待处理问题单</h2>
          <button onClick={() => navigate('/service/problems')} className="text-portBlue text-sm hover:text-portOrange">
            查看全部 →
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {(data?.stuckOrders ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无待处理问题单</div>
          ) : (
            (data?.stuckOrders ?? []).map((order) => {
              const chain = parseCauseChain(order.cause_chain)
              const lastEvent = chain.length > 0 ? chain[chain.length - 1] : null
              const isLoading = actionLoading === order.id

              return (
                <div key={order.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => navigate(`/service/problems/${order.id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[order.type] || 'bg-slate-100 text-slate-600'}`}>
                          {TYPE_LABELS[order.type] || order.type}
                        </span>
                        {order.severity === 'critical' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">严重</span>
                        )}
                        {order.severity === 'warning' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">预警</span>
                        )}
                        <span className="text-sm font-medium text-portNavy">{order.container_no}</span>
                      </div>
                      <span className="text-xs text-slate-500">{order.detected_at?.slice(0, 10)}</span>
                    </div>
                    {order.cause && (
                      <p className="text-xs text-red-500 mt-1">原因: {order.cause}</p>
                    )}
                    {lastEvent && (
                      <p className="text-xs text-slate-500 mt-1">
                        卡住原因: <span className="text-red-600 font-medium">{lastEvent.detail}</span>
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleQuickAction(order.id, 'reschedule')}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-portBlue/10 text-portBlue hover:bg-portBlue/20 disabled:opacity-50"
                    >
                      <Calendar size={12} />
                      改期
                    </button>
                    <button
                      onClick={() => handleQuickAction(order.id, 'supplement')}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-portOrange/10 text-portOrange hover:bg-portOrange/20 disabled:opacity-50"
                    >
                      <FileEdit size={12} />
                      补录
                    </button>
                    <button
                      onClick={() => handleQuickAction(order.id, 'reject')}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      驳回
                    </button>
                    <span className="text-xs text-slate-400 ml-auto">详情 →</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-portNavy">近期处理记录</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {recentHandled.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无处理记录</div>
          ) : (
            recentHandled.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/service/problems/${p.id}`)}
                className="w-full px-5 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type] || 'bg-slate-100 text-slate-600'}`}>
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                    <span className="text-sm font-medium text-portNavy">{p.container_no}</span>
                  </div>
                  <span className="text-xs text-slate-400">{p.updated_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {p.cause && (
                  <p className="text-xs text-slate-500 mt-1">{p.cause}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
