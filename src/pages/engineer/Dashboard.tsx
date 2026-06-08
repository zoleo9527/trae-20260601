import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Inbox, UserPlus, Search, Filter, BarChart3, Timer } from 'lucide-react'
import { useAppStore } from '@/store'
import MaintenanceCard from '@/components/MaintenanceCard'
import type { MaintenanceCategory, MaintenanceStatus } from '@/types'

const STATUS_OPTIONS: { value: MaintenanceStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待派工' },
  { value: 'in_progress', label: '处理中' },
  { value: 'completed', label: '已完成' },
]

const CATEGORY_OPTIONS: { value: MaintenanceCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'leak', label: '漏水' },
  { value: 'electrical', label: '电器' },
  { value: 'furniture', label: '家具' },
  { value: 'other', label: '其他' },
]

const CATEGORY_SUMMARY_CONFIG: { value: MaintenanceCategory; label: string; color: string; bg: string }[] = [
  { value: 'leak', label: '漏水', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { value: 'electrical', label: '电器', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'furniture', label: '家具', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { value: 'other', label: '其他', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
]

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分` : `${h}小时`
}

export default function EngineerDashboard() {
  const navigate = useNavigate()
  const { maintenanceOrders, rooms, currentUserId, assignMaintenanceOrder, uiFilters, updateUiFilter } = useAppStore()
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const statusFilter = uiFilters.engineerStatus
  const searchRoom = uiFilters.engineerSearchRoom
  const categoryFilter = uiFilters.engineerCategory
  const completedCategoryFilter = uiFilters.engineerCompletedCategory

  const myOrders = maintenanceOrders.filter(
    (o) => o.assignedTo === currentUserId
  )
  const unassignedOrders = maintenanceOrders.filter(
    (o) => !o.assignedTo && o.status === 'pending'
  )

  const allOrders = [...unassignedOrders, ...myOrders]

  const filtered = allOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (searchRoom) {
      const room = rooms.find((r) => r.id === order.roomId)
      if (!room || !room.number.includes(searchRoom)) return false
    }
    if (categoryFilter !== 'all' && order.category !== categoryFilter) return false
    return true
  })

  const filteredUnassigned = filtered.filter((o) => !o.assignedTo && o.status === 'pending')
  const filteredMyPending = filtered.filter((o) => o.assignedTo === currentUserId && o.status === 'pending')
  const filteredInProgress = filtered.filter((o) => o.assignedTo === currentUserId && o.status === 'in_progress')
  const filteredCompletedBase = filtered.filter((o) => o.assignedTo === currentUserId && o.status === 'completed')
  const filteredCompleted = filteredCompletedBase.filter((o) => {
    if (completedCategoryFilter !== 'all' && o.category !== completedCategoryFilter) return false
    return true
  })

  const totalUnassigned = unassignedOrders.length
  const totalInProgress = myOrders.filter((o) => o.status === 'in_progress').length
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayCompleted = myOrders.filter((o) => {
    if (o.status !== 'completed' || !o.completedAt) return false
    return new Date(o.completedAt) >= todayStart
  }).length

  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  const day = weekStart.getDay()
  const diff = day === 0 ? 6 : day - 1
  weekStart.setDate(weekStart.getDate() - diff)

  const weekCompleted = myOrders.filter((o) => {
    if (o.status !== 'completed' || !o.completedAt) return false
    return new Date(o.completedAt) >= weekStart
  })

  const categorySummary = CATEGORY_SUMMARY_CONFIG.map((cfg) => {
    const orders = weekCompleted.filter((o) => o.category === cfg.value)
    const count = orders.length
    let avgDuration = 0
    if (count > 0) {
      const totalMs = orders.reduce((sum, o) => {
        const created = new Date(o.createdAt).getTime()
        const completed = new Date(o.completedAt!).getTime()
        return sum + (completed - created)
      }, 0)
      avgDuration = totalMs / count
    }
    return { ...cfg, count, avgDuration }
  })

  const hasActiveFilters = statusFilter !== 'all' || searchRoom || categoryFilter !== 'all'

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)

  const handleClaim = (orderId: string) => {
    if (!currentUserId) return
    assignMaintenanceOrder(orderId, currentUserId)
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-[#1E3A5F]">维修工单</h1>

      <div className="mt-4 mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} />
          筛选条件
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">工单状态</label>
            <select
              value={statusFilter}
              onChange={(e) => updateUiFilter('engineerStatus', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">问题分类</label>
            <select
              value={categoryFilter}
              onChange={(e) => updateUiFilter('engineerCategory', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">房号关键字</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchRoom}
                onChange={(e) => updateUiFilter('engineerSearchRoom', e.target.value)}
                placeholder="输入房号"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              updateUiFilter('engineerStatus', 'all')
              updateUiFilter('engineerSearchRoom', '')
              updateUiFilter('engineerCategory', 'all')
            }}
            className="mt-2 text-xs text-[#1E3A5F] hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-6 rounded-lg border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 size={14} className="text-[#1E3A5F]" />
          <span className="text-gray-500">待派工</span>
          <span className={`font-bold ${totalUnassigned > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {totalUnassigned}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">处理中</span>
          <span className={`font-bold ${totalInProgress > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
            {totalInProgress}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">本日已完成</span>
          <span className="font-bold text-emerald-600">{todayCompleted}</span>
        </div>
      </div>

      {filteredUnassigned.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
              <UserPlus size={14} className="text-gray-500" />
            </div>
            <h2 className="font-medium text-gray-700">待派工</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {filteredUnassigned.length}
            </span>
          </div>
          <div className="space-y-3">
            {filteredUnassigned.map((order) => {
              const room = getRoom(order.roomId)
              if (!room) return null
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/engineer/order/${order.id}`)}>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-bold text-[#1E3A5F]">
                        {room.number}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        未分配
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{order.description}</p>
                  </div>
                  <button
                    onClick={() => handleClaim(order.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#16304f]"
                  >
                    <UserPlus size={14} />
                    领取
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <Wrench size={14} className="text-amber-600" />
            </div>
            <h2 className="font-medium text-gray-700">我的待处理</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
              {filteredMyPending.length}
            </span>
          </div>
          {filteredMyPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-gray-400">
              <Inbox size={32} />
              <p className="mt-2 text-sm">暂无待处理工单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyPending.map((order) => {
                const room = getRoom(order.roomId)
                if (!room) return null
                return (
                  <MaintenanceCard
                    key={order.id}
                    order={order}
                    room={room}
                    onClick={(id) => navigate(`/engineer/order/${id}`)}
                  />
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <Wrench size={14} className="text-blue-600" />
            </div>
            <h2 className="font-medium text-gray-700">处理中</h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
              {filteredInProgress.length}
            </span>
          </div>
          {filteredInProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-gray-400">
              <Inbox size={32} />
              <p className="mt-2 text-sm">暂无处理中工单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInProgress.map((order) => {
                const room = getRoom(order.roomId)
                if (!room) return null
                return (
                  <MaintenanceCard
                    key={order.id}
                    order={order}
                    room={room}
                    onClick={(id) => navigate(`/engineer/order/${id}`)}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>

      {filteredCompletedBase.length > 0 && (
        <section className="mt-8">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
          >
            {completedExpanded ? (
              <span>▾</span>
            ) : (
              <span>▸</span>
            )}
            <h2 className="font-medium">已完成</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {filteredCompletedBase.length}
            </span>
          </button>
          {completedExpanded && (
            <div className="mt-3 space-y-4">
              {weekCompleted.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Timer size={14} className="text-[#1E3A5F]" />
                    本周分类汇总
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {categorySummary.map((cs) => (
                      <div
                        key={cs.value}
                        className={`rounded-lg border p-3 ${cs.bg}`}
                      >
                        <div className={`text-xs font-medium ${cs.color}`}>{cs.label}</div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className={`text-lg font-bold ${cs.color}`}>{cs.count}</span>
                          <span className="text-xs text-gray-500">单</span>
                        </div>
                        {cs.count > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            平均 {formatDuration(cs.avgDuration)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">按分类筛选</span>
                <select
                  value={completedCategoryFilter}
                  onChange={(e) => updateUiFilter('engineerCompletedCategory', e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-[#1E3A5F] focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {filteredCompleted.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-gray-400">
                  <Inbox size={24} />
                  <p className="mt-1 text-sm">当前筛选无已完成工单</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCompleted.map((order) => {
                    const room = getRoom(order.roomId)
                    if (!room) return null
                    return (
                      <MaintenanceCard
                        key={order.id}
                        order={order}
                        room={room}
                        onClick={(id) => navigate(`/engineer/order/${id}`)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
