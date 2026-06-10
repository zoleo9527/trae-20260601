import {
    advanceOrder,
    batchReview,
    checkinOrder,
    fetchOrders
} from '@/api/client'
import BatchActions from '@/components/BatchActions'
import { useStore } from '@/store'
import type { MaintenanceOrder, Role } from '@/types'
import {
    AlertTriangle,
    CheckSquare,
    Clock,
    Loader2,
    MapPin,
    Search,
    Square,
    User,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusOptions = [
  { value: 'pending', label: '待签到' },
  { value: 'checked_in', label: '已签到' },
  { value: 'reviewing', label: '审核中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已退回' },
]

const typeOptions = [
  { value: 'routine', label: '日常维保' },
  { value: 'quarterly', label: '季度维保' },
  { value: 'annual', label: '年度维保' },
]

const statusLabels: Record<string, string> = {
  pending: '待签到',
  checked_in: '已签到',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已退回',
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  checked_in: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-purple-100 text-purple-700',
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

export default function OrderList() {
  const { currentRole, orders, setOrders, selectedIds, toggleSelect, clearSelection, selectAll, setSelectedIds } =
    useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [onlyAnomaly, setOnlyAnomaly] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
    clearSelection()
    loadOrders()
  }, [currentRole, clearSelection, loadOrders])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
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
      if (typeFilter.length > 0 && !typeFilter.includes(o.maintenanceType)) {
        return false
      }
      if (onlyMine && (o.currentHandler !== currentRole || o.status === 'completed' || o.status === 'rejected')) {
        return false
      }
      if (onlyAnomaly && !o.checkinAnomaly) {
        return false
      }
      return true
    })
  }, [orders, searchText, statusFilter, typeFilter, onlyMine, onlyAnomaly, currentRole])

  const selectableOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'completed' && o.status !== 'rejected')
  }, [filteredOrders])

  const selectableIds = useMemo(() => {
    return new Set(selectableOrders.map((o) => o.id))
  }, [selectableOrders])

  useEffect(() => {
    const pruned = selectedIds.filter((id) => selectableIds.has(id))
    if (pruned.length !== selectedIds.length) {
      setSelectedIds(pruned)
    }
  }, [selectableIds])

  const allSelected =
    selectableOrders.length > 0 &&
    selectableOrders.every((o) => selectedIds.includes(o.id))

  const handleToggleAll = () => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll(selectableOrders.map((o) => o.id))
    }
  }

  const getStuckPoint = (order: MaintenanceOrder) => {
    if (order.status === 'pending') return '未到场签到'
    if (order.status === 'checked_in') return order.checkinAnomaly ? '异常待跟进' : '待客服跟进确认'
    if (order.status === 'reviewing') return '待主管审核'
    if (order.status === 'rejected') return '审核退回，待重新跟进'
    return '已完成'
  }

  const canQuickAction = (order: MaintenanceOrder) => {
    if (currentRole === 'technician' && order.status === 'pending') return true
    if (currentRole === 'service' && order.status === 'checked_in') return true
    if (currentRole === 'supervisor' && order.status === 'reviewing') return true
    return false
  }

  const quickActionLabel = () => {
    if (currentRole === 'technician') return '签到'
    if (currentRole === 'service') return '推进'
    return '审核通过'
  }

  const handleQuickAction = async (order: MaintenanceOrder) => {
    setActionLoading(order.id)
    try {
      if (currentRole === 'technician' && order.status === 'pending') {
        await checkinOrder(order.id, false)
      } else if (currentRole === 'service' && order.status === 'checked_in') {
        await advanceOrder(order.id)
      } else if (currentRole === 'supervisor' && order.status === 'reviewing') {
        // 单条审核走批量接口更简单
        await batchReview([order.id], true)
      }
      loadOrders()
    } catch (e) {
      console.error('操作失败', e)
    } finally {
      setActionLoading(null)
    }
  }

  const myTodoCount = orders.filter((o) => o.currentHandler === currentRole && o.status !== 'completed' && o.status !== 'rejected').length

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* 页面标题 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">维保计划处理</h2>
          <p className="mt-1 text-sm text-slate-500">
            维保计划不是终点，到场签到只是开始，请跟完整条链路
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            我的待办 <span className="font-semibold text-amber-600">{myTodoCount}</span> 项
          </span>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索 */}
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

          {/* 状态筛选 */}
          <select
            multiple
            value={statusFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
              setStatusFilter(selected)
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 类型筛选 */}
          <select
            multiple
            value={typeFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
              setTypeFilter(selected)
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 只看我的 */}
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
              onlyMine
                ? 'bg-amber-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" />
            只看我的
          </button>

          {/* 有异常 */}
          <button
            onClick={() => setOnlyAnomaly(!onlyAnomaly)}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
              onlyAnomaly
                ? 'bg-rose-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            有异常
          </button>

          {/* 重置 */}
          <button
            onClick={() => {
              setSearchText('')
              setStatusFilter([])
              setTypeFilter([])
              setOnlyMine(false)
              setOnlyAnomaly(false)
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
            <span className="text-sm text-slate-400">暂无匹配的工单</span>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <button
                    onClick={handleToggleAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
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
                  卡点说明
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  责任人
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  计划日期
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id)
                const isClosed = order.status === 'completed' || order.status === 'rejected'
                const isMine = order.currentHandler === currentRole
                const isStuck =
                  order.status === 'pending' ||
                  order.status === 'rejected' ||
                  order.checkinAnomaly

                return (
                  <tr
                    key={order.id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      isStuck ? 'bg-rose-50/30' : ''
                    }`}
                    onClick={() => navigate(`/order/${order.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => !isClosed && toggleSelect(order.id)}
                        disabled={isClosed}
                        className={isClosed ? "cursor-not-allowed text-slate-200" : "text-slate-400 hover:text-slate-600"}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Square className={`h-4 w-4 ${isClosed ? 'text-slate-200' : ''}`} />
                        )}
                      </button>
                    </td>
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
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                      {order.checkinAnomaly && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                          <AlertTriangle className="h-3 w-3" />
                          有异常
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${isStuck ? 'font-medium text-rose-600' : 'text-slate-600'}`}>
                        {getStuckPoint(order)}
                      </div>
                      {order.checkinAnomalyDesc && (
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {order.checkinAnomalyDesc}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            order.currentHandler === 'technician'
                              ? 'bg-blue-500'
                              : order.currentHandler === 'service'
                                ? 'bg-emerald-500'
                                : 'bg-orange-500'
                          }`}
                        />
                        <span className="text-sm text-slate-700">
                          {order.assignedTechnician}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.status === 'completed' ? '已完成' : order.status === 'rejected' ? '已退回' : roleLabels[order.currentHandler as Role] + '处理中'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {order.plannedDate}
                      {order.checkinTime && (
                        <div className="text-xs text-slate-400">
                          签到：{order.checkinTime}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {canQuickAction(order) ? (
                        <button
                          disabled={actionLoading === order.id}
                          onClick={() => handleQuickAction(order)}
                          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                        >
                          {actionLoading === order.id ? (
                            <Loader2 className="inline h-3 w-3 animate-spin" />
                          ) : (
                            quickActionLabel()
                          )}
                        </button>
                      ) : (
                        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          详情
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>共 {filteredOrders.length} 条</span>
          <span>
            已选 {selectedIds.length} 条
          </span>
        </div>
      </div>

      <BatchActions onRefresh={loadOrders} />
    </div>
  )
}
