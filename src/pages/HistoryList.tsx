import { fetchOrders } from '@/api/client'
import { useStore } from '@/store'
import type { Role } from '@/types'
import {
    Clock,
    Loader2,
    MapPin,
    Search,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusLabels: Record<string, string> = {
  completed: '已完成',
  rejected: '已退回',
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
}

const typeLabels: Record<string, string> = {
  routine: '日常',
  quarterly: '季度',
  annual: '年度',
}

const roleLabels: Record<Role, string> = {
  technician: '维保技师',
  service: '客服',
  supervisor: '项目主管',
}

export default function HistoryList() {
  const { currentRole, orders, setOrders } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>(['completed', 'rejected'])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchOrders()
      setOrders(data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [setOrders])

  useEffect(() => {
    loadOrders()
  }, [currentRole, loadOrders])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status !== 'completed' && o.status !== 'rejected') return false
      if (searchText) {
        const text = searchText.toLowerCase()
        if (
          !o.elevatorNo.toLowerCase().includes(text) &&
          !o.elevatorAddress.toLowerCase().includes(text) &&
          !o.id.toLowerCase().includes(text) &&
          !o.assignedTechnician.toLowerCase().includes(text)
        ) {
          return false
        }
      }
      if (statusFilter.length > 0 && !statusFilter.includes(o.status)) {
        return false
      }
      return true
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [orders, searchText, statusFilter])

  const completedCount = orders.filter((o) => o.status === 'completed').length
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* 页面标题 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">历史记录回看</h2>
        <p className="mt-1 text-sm text-slate-500">
          已完成和已退回的维保记录，可回看完整流程和备注
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
          <div className="text-sm text-emerald-600">已完成</div>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="text-2xl font-bold text-rose-700">{rejectedCount}</div>
          <div className="text-sm text-rose-600">已退回</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索工单号、电梯编号、地址、技师..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex gap-2">
            {['completed', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  if (statusFilter.includes(status)) {
                    setStatusFilter(statusFilter.filter((s) => s !== status))
                  } else {
                    setStatusFilter([...statusFilter, status])
                  }
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  statusFilter.includes(status)
                    ? status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSearchText('')
              setStatusFilter(['completed', 'rejected'])
            }}
            className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            重置
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-slate-400" />
            <span className="text-sm text-slate-400">加载中...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="mb-3 h-10 w-10 text-slate-300" />
            <span className="text-sm text-slate-400">暂无历史记录</span>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  电梯/工单
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  维保类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  执行技师
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  计划日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  完成时间
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {order.elevatorNo}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[240px]">
                        {order.elevatorAddress}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      工单号：{order.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {typeLabels[order.maintenanceType]}
                    </span>
                    {order.checkinAnomaly && (
                      <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        有异常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-700">
                        {order.assignedTechnician}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {order.plannedDate}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {order.updatedAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      回看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>共 {filteredOrders.length} 条</span>
        </div>
      </div>
    </div>
  )
}
