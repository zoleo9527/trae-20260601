import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '@/stores/dashboard'
import { useMoveTasksStore } from '@/stores/move-tasks'
import { problemApi, type CauseChainItem } from '@/lib/api'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileCheck,
  Truck,
  RefreshCw,
  Timer,
  ArrowRight,
  Bell,
  Clock,
} from 'lucide-react'

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

const CHAIN_EVENT_LABELS: Record<string, string> = {
  container_entered: '进场',
  free_storage_set: '免堆期',
  free_storage_expired: '已超期',
  no_inspection: '无查验',
  no_inspection_plan: '无查验计划',
  inspection_planned: '查验计划',
  inspection_executed: '执行查验',
  inspection_result: '查验结果',
  inspection_released: '查验放行',
  move_task_created: '移箱创建',
  move_started: '移箱开始',
  move_completed: '移箱完成',
  stuck_detected: '停滞检测',
  yard_stagnation_detected: '滞留检测',
}

function parseCauseChain(raw: string | undefined | null): CauseChainItem[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function getLastChainEvent(raw: string | undefined | null): string | null {
  const chain = parseCauseChain(raw)
  if (chain.length === 0) return null
  const last = chain[chain.length - 1]
  const label = CHAIN_EVENT_LABELS[last.event] || last.event
  return last.detail ? `${label}: ${last.detail}` : label
}

export default function DispatchDashboard() {
  const { data, fetchDashboard } = useDashboardStore()
  const { tasks, fetchTasks } = useMoveTasksStore()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    setRefreshing(true)
    try {
      await fetchDashboard('dispatch')
      await fetchTasks({ status: 'pending' })
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
    const init = async () => {
      setDetecting(true)
      try {
        await problemApi.detect()
      } catch {} finally {
        setDetecting(false)
      }
      load()
    }
    init()
    timerRef.current = setInterval(load, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const getStuckOrderNav = (order: { type: string; inspection_id?: number | null }) => {
    if (order.inspection_id || order.type === 'missed_notify' || order.type === 'detained' || order.type === 'stuck_inspecting') {
      return '/dispatch/inspection'
    }
    return '/dispatch/move-tasks'
  }

  const typeBreakdown = data?.typeBreakdown ?? {}
  const breakdownParts = Object.entries(typeBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${TYPE_LABELS[k] ?? k}${v}`)
    .join('/')

  const criticalCount = (data?.pendingActions?.criticalCount as number) ?? 0
  const warningCount = (data?.pendingActions?.warningCount as number) ?? 0

  const unnotifiedInspections = (data?.pendingActions?.unnotifiedInspections as any[]) ?? []
  const overdueMoveTasks = (data?.pendingActions?.overdueMoveTasks as any[]) ?? []
  const yardStagnationOrders = (data?.stuckOrders ?? []).filter((o: any) => o.type === 'yard_stagnation')

  const pendingMoveTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const inProgressMoves = pendingMoveTasks.filter((t) => t.status === 'in_progress')
  const pendingMoves = pendingMoveTasks.filter((t) => t.status === 'pending')

  const stats = [
    { label: '今日进场', value: data?.todayStats.entered ?? 0, icon: <ArrowDownToLine size={20} className="text-portBlue" />, color: 'bg-portBlue/10' },
    { label: '今日出场', value: data?.todayStats.exited ?? 0, icon: <ArrowUpFromLine size={20} className="text-green-600" />, color: 'bg-green-50' },
    { label: '今日查验', value: data?.todayStats.inspections ?? 0, icon: <FileCheck size={20} className="text-portOrange" />, color: 'bg-orange-50' },
    { label: '今日移箱', value: data?.todayStats.moves ?? 0, icon: <Truck size={20} className="text-purple-600" />, color: 'bg-purple-50' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-portNavy">堆场调度工作台</h1>
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
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <div className="flex-1">
              <span className="font-bold text-red-700">{criticalCount} 条严重卡单</span>
              {breakdownParts && <span className="text-red-500 text-sm ml-2">({breakdownParts})</span>}
            </div>
            <button
              onClick={() => {
                const first = data!.stuckOrders.find((o: any) => o.severity === 'critical') || data!.stuckOrders[0]
                navigate(getStuckOrderNav(first))
              }}
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
              onClick={() => {
                const first = data!.stuckOrders.find((o: any) => o.severity === 'warning') || data!.stuckOrders[0]
                navigate(getStuckOrderNav(first))
              }}
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

      {unnotifiedInspections.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
          <div className="px-5 py-4 border-b border-yellow-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-yellow-600" />
              <h2 className="font-bold text-yellow-800">未通知查验</h2>
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{unnotifiedInspections.length}</span>
            </div>
            <button onClick={() => navigate('/dispatch/inspection')} className="text-yellow-700 text-sm hover:text-yellow-800">
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-yellow-100">
            {unnotifiedInspections.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-yellow-400 rounded-full" />
                  <div>
                    <span className="text-sm font-medium text-yellow-900">{item.container_no || `箱#${item.container_id}`}</span>
                    <span className="text-xs text-yellow-600 ml-2">{item.type || '查验'}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dispatch/inspection')}
                  className="text-xs text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  去通知 →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-100 mb-6">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-portNavy">查验→移箱 工作流</h2>
        </div>
        <div className="p-5">
          {yardStagnationOrders.length === 0 && pendingMoveTasks.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-6">暂无待处理工作流</div>
          ) : (
            <div className="space-y-4">
              {yardStagnationOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-slate-600">查验完成 / 待创建移箱</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{yardStagnationOrders.length}</span>
                  </div>
                  <div className="space-y-2 ml-5">
                    {yardStagnationOrders.slice(0, 5).map((order: any) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-teal-100"
                        onClick={() => navigate('/dispatch/inspection')}
                      >
                        <div className="w-1.5 h-6 bg-teal-400 rounded-full" />
                        <span className="text-sm font-medium text-teal-900">{order.container_no || `箱#${order.id}`}</span>
                        <span className="text-xs text-teal-600">{order.yard_slot}</span>
                        <ArrowRight size={14} className="text-teal-400 mx-1" />
                        <span className="text-xs text-teal-500">需移箱</span>
                        {getLastChainEvent(order.cause_chain) && (
                          <span className="text-xs text-teal-600 ml-auto">{getLastChainEvent(order.cause_chain)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {yardStagnationOrders.length > 0 && pendingMoveTasks.length > 0 && (
                <div className="flex items-center justify-center">
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              )}

              {pendingMoves.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-purple-600" />
                    <span className="text-xs font-semibold text-slate-600">自动创建移箱</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{pendingMoves.length}</span>
                  </div>
                  <div className="space-y-2 ml-5">
                    {pendingMoves.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-purple-100"
                        onClick={() => navigate('/dispatch/move-tasks')}
                      >
                        <div className="w-1.5 h-6 bg-purple-400 rounded-full" />
                        <span className="text-sm font-medium text-purple-900">{task.container_no || `箱#${task.container_id}`}</span>
                        <span className="text-xs text-purple-600">{task.from_slot} → {task.to_slot}</span>
                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full ml-auto">待执行</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingMoves.length > 0 && inProgressMoves.length > 0 && (
                <div className="flex items-center justify-center">
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              )}

              {inProgressMoves.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-slate-600">移箱执行中</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{inProgressMoves.length}</span>
                  </div>
                  <div className="space-y-2 ml-5">
                    {inProgressMoves.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-blue-100"
                        onClick={() => navigate('/dispatch/move-tasks')}
                      >
                        <div className="w-1.5 h-6 bg-blue-400 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-blue-900">{task.container_no || `箱#${task.container_id}`}</span>
                        <span className="text-xs text-blue-600">{task.from_slot} → {task.to_slot}</span>
                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full ml-auto">执行中</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 ml-5">
                <div className="w-1.5 h-6 bg-green-400 rounded-full" />
                <span className="text-xs text-slate-400">→ 移箱完成</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {overdueMoveTasks.length > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 mb-6">
          <div className="px-5 py-4 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              <h2 className="font-bold text-red-800">超时移箱</h2>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{overdueMoveTasks.length}</span>
            </div>
            <button onClick={() => navigate('/dispatch/move-tasks')} className="text-red-700 text-sm hover:text-red-800">
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-red-100">
            {overdueMoveTasks.slice(0, 5).map((item: any, idx: number) => (
              <div
                key={idx}
                className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-red-100"
                onClick={() => navigate('/dispatch/move-tasks')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-red-400 rounded-full" />
                  <div>
                    <span className="text-sm font-medium text-red-900">{item.container_no || `箱#${item.container_id || item.id}`}</span>
                    <span className="text-xs text-red-600 ml-2">{item.reason || ''}</span>
                  </div>
                </div>
                {item.overdue_hours != null && (
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">超时 {item.overdue_hours}h</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.stuckOrders?.length ?? 0) > 0 && (
        <div className="bg-white rounded-lg border border-slate-100 mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-portNavy">卡单明细</h2>
            <span className="text-xs text-slate-400">{data!.stuckOrders.length} 条</span>
          </div>
          <div className="divide-y divide-slate-50">
            {data!.stuckOrders.map((order: any, idx: number) => (
              <div
                key={idx}
                className="px-5 py-3 cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(getStuckOrderNav(order))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${order.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-portNavy">{order.container_no || `箱#${order.container_id || order.id}`}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TYPE_LABELS[order.type] || order.type}</span>
                    </div>
                  </div>
                  {order.severity === 'critical' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">严重</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">预警</span>
                  )}
                </div>
                {getLastChainEvent(order.cause_chain) && (
                  <p className="text-xs text-red-500 mt-1 ml-4">
                    卡住原因: {getLastChainEvent(order.cause_chain)}
                  </p>
                )}
                {!getLastChainEvent(order.cause_chain) && order.cause && (
                  <p className="text-xs text-red-500 mt-1 ml-4">原因: {order.cause}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-portNavy">待执行移箱任务</h2>
          <button onClick={() => navigate('/dispatch/move-tasks')} className="text-portBlue text-sm hover:text-portOrange">
            查看全部 →
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {tasks.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无待执行任务</div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-slate-300 rounded-full" />
                  <div>
                    <span className="text-sm font-medium text-portNavy">{task.container_no || `箱#${task.container_id}`}</span>
                    <span className="text-xs text-slate-400 ml-2">{task.from_slot} → {task.to_slot}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{task.reason}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
