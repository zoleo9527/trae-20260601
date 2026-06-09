import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '@/stores/dashboard'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, FileCheck, Package, RefreshCw, Timer } from 'lucide-react'
import { problemApi } from '@/lib/api'

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

const SEVERITY_LABELS: Record<string, { text: string; className: string }> = {
  critical: { text: '严重', className: 'bg-red-50 text-red-600' },
  warning: { text: '预警', className: 'bg-amber-50 text-amber-600' },
}

export default function GateDashboard() {
  const { data, fetchDashboard } = useDashboardStore()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    setRefreshing(true)
    try {
      await fetchDashboard('gate')
    } catch {} finally {
      setRefreshing(false)
    }
  }

  const handleDetect = async () => {
    setDetecting(true)
    try {
      await problemApi.detect()
      await load()
    } catch {} finally {
      setDetecting(false)
    }
  }

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const typeBreakdown = data?.typeBreakdown ?? {}
  const breakdownParts = Object.entries(typeBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${TYPE_LABELS[k] ?? k}${v}`)
    .join('/')

  const criticalCount = (data?.pendingActions?.criticalCount as number) ?? 0
  const warningCount = (data?.pendingActions?.warningCount as number) ?? 0

  const stats = [
    { label: '今日进场', value: data?.todayStats.entered ?? 0, icon: <ArrowDownToLine size={20} className="text-portBlue" />, color: 'bg-portBlue/10' },
    { label: '今日出场', value: data?.todayStats.exited ?? 0, icon: <ArrowUpFromLine size={20} className="text-green-600" />, color: 'bg-green-50' },
    { label: '今日查验', value: data?.todayStats.inspections ?? 0, icon: <FileCheck size={20} className="text-portOrange" />, color: 'bg-orange-50' },
    { label: '在场箱数', value: data?.pendingCount ?? 0, icon: <Package size={20} className="text-portNavy" />, color: 'bg-slate-100' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-portNavy">闸口员工作台</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-1 text-portBlue hover:text-portOrange disabled:opacity-50"
          >
            <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
            运行检测
          </button>
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
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <div className="flex-1">
              <span className="font-bold text-red-700">{criticalCount} 条严重卡单</span>
              {breakdownParts && <span className="text-red-500 text-sm ml-2">({breakdownParts})</span>}
            </div>
            <button
              onClick={() => navigate('/gate/containers')}
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
              <span className="font-bold text-amber-700">{warningCount} 条预警卡单</span>
              <span className="text-amber-500 text-sm ml-2">请关注处理</span>
            </div>
            <button
              onClick={() => navigate('/gate/containers')}
              className="text-amber-600 text-sm font-medium hover:text-amber-700"
            >
              查看详情 →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="bg-white rounded-lg border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-portNavy">待办事项</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {(data?.stuckOrders ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无待办事项</div>
          ) : (
            (data?.stuckOrders ?? []).map((order) => (
              <div key={order.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-portNavy">{order.container_no}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABELS[order.type] ?? order.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_LABELS[order.severity]?.className ?? 'bg-slate-100 text-slate-500'}`}>{SEVERITY_LABELS[order.severity]?.text ?? order.severity}</span>
                  </div>
                  <span className="text-xs text-slate-400">{order.detected_at?.slice(0, 10)}</span>
                </div>
                {order.cause && (
                  <p className="text-xs text-red-500 mt-1">原因: {order.cause}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
