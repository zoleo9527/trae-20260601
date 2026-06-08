import { useState } from 'react'
import { useAppStore } from '@/store/index'
import StatusBadge from '@/components/StatusBadge'

export default function Tasks() {
  const { inspectionTasks, rooms, users, assignTask } = useAppStore()
  const [selectedAttendant, setSelectedAttendant] = useState<Record<string, string>>({})

  const attendants = users.filter((u) => u.role === 'attendant')
  const pendingTasks = inspectionTasks.filter((t) => t.status === 'pending')
  const assignedTasks = inspectionTasks.filter(
    (t) => t.status === 'assigned' || t.status === 'in_progress'
  )

  const getRoomNumber = (roomId: string) =>
    rooms.find((r) => r.id === roomId)?.number ?? roomId

  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name ?? '未知' : '—'

  const handleAssign = (taskId: string) => {
    const attendantId = selectedAttendant[taskId]
    if (!attendantId) return
    assignTask(taskId, attendantId)
    setSelectedAttendant((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[#1E3A5F]">任务分配</h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">待分配任务</h2>
          {pendingTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
              暂无待分配任务
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif text-lg font-bold text-[#1E3A5F]">
                      {getRoomNumber(task.roomId)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAttendant[task.id] ?? ''}
                      onChange={(e) =>
                        setSelectedAttendant((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1E3A5F] focus:outline-none"
                    >
                      <option value="">选择保洁员</option>
                      {attendants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(task.id)}
                      disabled={!selectedAttendant[task.id]}
                      className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162d4a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      分配
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">已分配任务</h2>
          {assignedTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
              暂无已分配任务
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif text-lg font-bold text-[#1E3A5F]">
                        {getRoomNumber(task.roomId)}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {getUserName(task.assignedTo)}
                      </span>
                    </div>
                    <StatusBadge status={task.status} category="inspection" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
