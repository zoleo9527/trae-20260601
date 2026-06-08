import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Wrench, Inbox, UserPlus } from 'lucide-react'
import { useAppStore } from '@/store'
import MaintenanceCard from '@/components/MaintenanceCard'

export default function EngineerDashboard() {
  const navigate = useNavigate()
  const { maintenanceOrders, rooms, currentUserId, assignMaintenanceOrder } = useAppStore()
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const myOrders = maintenanceOrders.filter(
    (o) => o.assignedTo === currentUserId
  )
  const unassignedOrders = maintenanceOrders.filter(
    (o) => !o.assignedTo && o.status === 'pending'
  )

  const pendingOrders = myOrders.filter((o) => o.status === 'pending')
  const inProgressOrders = myOrders.filter((o) => o.status === 'in_progress')
  const completedOrders = myOrders.filter((o) => o.status === 'completed')

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)

  const handleClaim = (orderId: string) => {
    if (!currentUserId) return
    assignMaintenanceOrder(orderId, currentUserId)
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-[#1E3A5F]">维修工单</h1>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <Wrench size={14} className="text-amber-600" />
            </div>
            <h2 className="font-medium text-gray-700">我的待处理</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
              {pendingOrders.length}
            </span>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-gray-400">
              <Inbox size={32} />
              <p className="mt-2 text-sm">暂无待处理工单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => {
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
              {inProgressOrders.length}
            </span>
          </div>
          {inProgressOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-gray-400">
              <Inbox size={32} />
              <p className="mt-2 text-sm">暂无处理中工单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressOrders.map((order) => {
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

      {unassignedOrders.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
              <UserPlus size={14} className="text-gray-500" />
            </div>
            <h2 className="font-medium text-gray-700">待领取工单</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {unassignedOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {unassignedOrders.map((order) => {
              const room = getRoom(order.roomId)
              if (!room) return null
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
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
                    className="flex items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#16304f]"
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

      {completedOrders.length > 0 && (
        <section className="mt-8">
          <button
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
          >
            {completedExpanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
            <h2 className="font-medium">已完成</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {completedOrders.length}
            </span>
          </button>
          {completedExpanded && (
            <div className="mt-3 space-y-3">
              {completedOrders.map((order) => {
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
      )}
    </div>
  )
}
