import { fetchOrders } from '@/api/client'
import { useStore } from '@/store'
import type { MaintenanceOrder, Role } from '@/types'
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Clock,
    Loader2,
    UserCheck,
    Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Stats {
  total: number
  pending: number
  checkedIn: number
  reviewing: number
  completed: number
  rejected: number
  anomaly: number
  myTodo: number
}

const roleLabels: Record<Role, string> = {
  technician: '维保技师',
  service: '客服',
  supervisor: '项目主管',
}

const statusLabels: Record<string, string> = {
  pending: '待签到',
  checked_in: '已签到',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已退回',
}

const typeLabels: Record<string, string> = {
  routine: '日常',
  quarterly: '季度',
  annual: '年度',
}

export default function Dashboard() {
  const { currentRole } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    checkedIn: 0,
    reviewing: 0,
    completed: 0,
    rejected: 0,
    anomaly: 0,
    myTodo: 0,
  })
  const [myTodoList, setMyTodoList] = useState<MaintenanceOrder[]>([])
  const [anomalyList, setAnomalyList] = useState<MaintenanceOrder[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const allOrders = await fetchOrders()

      const total = allOrders.length
      const pending = allOrders.filter((o) => o.status === 'pending').length
      const checkedIn = allOrders.filter((o) => o.status === 'checked_in').length
      const reviewing = allOrders.filter((o) => o.status === 'reviewing').length
      const completed = allOrders.filter((o) => o.status === 'completed').length
      const rejected = allOrders.filter((o) => o.status === 'rejected').length
      const anomaly = allOrders.filter((o) => o.checkinAnomaly).length

      const myTodos = allOrders.filter((o) => o.currentHandler === currentRole)
      const myTodo = myTodos.length

      setStats({
        total,
        pending,
        checkedIn,
        reviewing,
        completed,
        rejected,
        anomaly,
        myTodo,
      })

      setMyTodoList(myTodos.slice(0, 5))
      setAnomalyList(allOrders.filter((o) => o.checkinAnomaly).slice(0, 5))
    } catch (e) {
      console.error('加载统计失败', e)
    } finally {
      setLoading(false)
    }
  }, [currentRole])

  useEffect(() => {
    loadData()
  }, [loadData])

  const statCards = [
    {
      label: '总工单',
      value: stats.total,
      icon: ClipboardList,
      color: 'bg-slate-500',
      bg: 'bg-slate-50',
    },
    {
      label: '待签到',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: '已签到',
      value: stats.checkedIn,
      icon: UserCheck,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: '审核中',
      value: stats.reviewing,
      icon: Wrench,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: '已完成',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: '异常工单',
      value: stats.anomaly,
      icon: AlertTriangle,
      color: 'bg-rose-500',
      bg: 'bg-rose-50',
    },
  ]

  const getStuckPoint = (order: MaintenanceOrder) => {
    if (order.status === 'pending') return '未到场签到'
    if (order.status === 'checked_in') return order.checkinAnomaly ? '异常待跟进' : '待客服跟进确认'
    if (order.status === 'reviewing') return '待主管审核'
    if (order.status === 'rejected') return '审核退回，待重新跟进'
    return '已完成'
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* 欢迎 + 待办提醒 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">
            你好，{roleLabels[currentRole]}
          </h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            我的待办 {stats.myTodo} 项
          </span>
        </div>
        <p className="text-sm text-slate-500">
          维保计划不是终点，到场签到只是开始，请跟完整条链路
        </p>
      </div>

      {/* 三问提醒条 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-1 text-xs font-medium text-blue-700">① 谁在处理？</div>
          <div className="text-lg font-bold text-blue-800">
            {roleLabels[currentRole]}
          </div>
          <div className="mt-1 text-xs text-blue-600">
            当前登录角色负责对应阶段
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 text-xs font-medium text-amber-700">② 卡在哪里？</div>
          <div className="text-lg font-bold text-amber-800">
            {stats.myTodo} 项卡在我这里
          </div>
          <div className="mt-1 text-xs text-amber-600">
            请及时处理避免超时
          </div>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="mb-1 text-xs font-medium text-rose-700">③ 为什么没完成？</div>
          <div className="text-lg font-bold text-rose-800">
            {stats.anomaly} 项有异常
          </div>
          <div className="mt-1 text-xs text-rose-600">
            异常工单需重点跟进
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`rounded-lg border border-slate-200 ${card.bg} p-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-500">{card.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 我的待办 */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              我的待办（{stats.myTodo}）
            </h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-amber-600 hover:text-amber-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {myTodoList.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                暂无待办
              </div>
            ) : (
              myTodoList.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {order.elevatorNo}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {typeLabels[order.maintenanceType]}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          order.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : order.status === 'checked_in'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'reviewing'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {order.elevatorAddress}
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-xs font-medium text-amber-600">
                      {getStuckPoint(order)}
                    </div>
                    <div className="text-xs text-slate-400">
                      计划 {order.plannedDate}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 异常提醒 */}
        <div className="rounded-lg border border-rose-200 bg-white">
          <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-rose-800">
                异常提醒（{stats.anomaly}）
              </h3>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {anomalyList.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                暂无异常
              </div>
            ) : (
              anomalyList.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="flex cursor-pointer items-start justify-between px-4 py-3 hover:bg-rose-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {order.elevatorNo}
                      </span>
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">
                        异常
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {order.checkinAnomalyDesc}
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-xs text-slate-400">
                      {roleLabels[order.currentHandler as Role]}处理中
                    </div>
                    <div className="text-xs text-slate-400">
                      计划 {order.plannedDate}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
