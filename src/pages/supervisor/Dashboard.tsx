import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '@/store/index'
import RoomCard from '@/components/RoomCard'
import StatusBadge from '@/components/StatusBadge'

const floors = ['全部', '3F', '4F', '5F']

export default function Dashboard() {
  const { rooms, inspectionTasks, maintenanceOrders, minibarChecks, linenRecords, users } = useAppStore()
  const [selectedFloor, setSelectedFloor] = useState('全部')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const filteredRooms = selectedFloor === '全部'
    ? rooms
    : rooms.filter((r) => r.floor === selectedFloor)

  const statusCounts = {
    dirty: rooms.filter((r) => r.status === 'dirty').length,
    clean: rooms.filter((r) => r.status === 'clean').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    inspecting: rooms.filter((r) => r.status === 'inspecting').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const roomTasks = selectedRoomId
    ? inspectionTasks.filter((t) => t.roomId === selectedRoomId)
    : []
  const roomOrders = selectedRoomId
    ? maintenanceOrders.filter((o) => o.roomId === selectedRoomId)
    : []
  const roomMinibarChecks = selectedRoomId
    ? minibarChecks.filter((c) => c.roomId === selectedRoomId)
    : []
  const roomLinenRecords = selectedRoomId
    ? linenRecords.filter((lr) => lr.roomId === selectedRoomId)
    : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">房态看板</h1>
        <p className="mt-1 text-sm text-gray-500">
          共{rooms.length}间 | 空脏 {statusCounts.dirty} | 空净 {statusCounts.clean} | 住客 {statusCounts.occupied} | 查房中 {statusCounts.inspecting} | 维修中 {statusCounts.maintenance}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => setSelectedFloor(floor)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedFloor === floor
                ? 'bg-[#1E3A5F] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {floor}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={setSelectedRoomId} />
        ))}
      </div>

      {selectedRoom && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedRoomId(null)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-[#1E3A5F]">
                {selectedRoom.number} 详情
              </h2>
              <button
                onClick={() => setSelectedRoomId(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-serif text-2xl font-bold text-[#1E3A5F]">
                    {selectedRoom.number}
                  </span>
                  <StatusBadge status={selectedRoom.status} category="room" />
                </div>
                <p className="text-sm text-gray-500">{selectedRoom.floor}层</p>
                {selectedRoom.currentGuest && (
                  <p className="text-sm text-gray-600">住客：{selectedRoom.currentGuest}</p>
                )}
              </div>

              {roomTasks.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">查房任务</h3>
                  <div className="space-y-2">
                    {roomTasks.map((task) => {
                      const assignee = task.assignedTo
                        ? users.find((u) => u.id === task.assignedTo)?.name
                        : undefined
                      return (
                        <div key={task.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {new Date(task.createdAt).toLocaleString('zh-CN')}
                            </span>
                            <StatusBadge status={task.status} category="inspection" />
                          </div>
                          {assignee && (
                            <p className="mt-1 text-sm text-gray-500">执行人：{assignee}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {roomOrders.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">维修工单</h3>
                  <div className="space-y-2">
                    {roomOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{order.description}</span>
                          <StatusBadge status={order.status} category="maintenance" />
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roomMinibarChecks.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">迷你吧核对</h3>
                  <div className="space-y-2">
                    {roomMinibarChecks.map((check) => (
                      <div key={check.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {check.checkedAt
                              ? new Date(check.checkedAt).toLocaleString('zh-CN')
                              : '待核对'}
                          </span>
                          <StatusBadge status={check.status} category="minibar" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roomLinenRecords.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">布草记录</h3>
                  <div className="space-y-2">
                    {roomLinenRecords.map((lr) => (
                      <div key={lr.id} className="rounded-lg border p-3">
                        <p className="text-sm text-gray-700">{lr.itemType}</p>
                        <p className="text-xs text-gray-500">
                          应{lr.expectedCount} / 实{lr.actualCount} — {lr.action === 'none' ? '无操作' : lr.action === 'replace' ? '更换' : '补充'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
