import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/index'
import TaskCard from '@/components/TaskCard'
import StatusBadge from '@/components/StatusBadge'
import { Wine, ArrowRight, Clock } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUserId, inspectionTasks, rooms, users, minibarChecks } = useAppStore()

  const myTasks = inspectionTasks.filter((t) => t.assignedTo === currentUserId)
  const assignedTasks = myTasks.filter((t) => t.status === 'assigned')
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress')

  const myTaskRoomIds = myTasks.map((t) => t.roomId)
  const pendingMinibarChecks = minibarChecks.filter(
    (c) => c.status === 'pending' && myTaskRoomIds.includes(c.roomId)
  )

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)
  const getUserName = (userId?: string) =>
    userId ? users.find((u) => u.id === userId)?.name : undefined

  const handleTaskClick = (taskId: string) => {
    const task = inspectionTasks.find((t) => t.id === taskId)
    if (task?.status === 'assigned') {
      useAppStore.getState().startInspection(taskId)
    }
    navigate(`/attendant/inspect/${taskId}`)
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-[#1E3A5F]">工作台</h1>
      <p className="mb-6 text-sm text-gray-500">
        待处理 {assignedTasks.length} · 进行中 {inProgressTasks.length}
        {pendingMinibarChecks.length > 0 && ` · 待核对迷你吧 ${pendingMinibarChecks.length}`}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            待处理
          </h2>
          {assignedTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white py-8 text-center text-sm text-gray-400">
              暂无待处理任务
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTasks.map((task) => {
                const room = getRoom(task.roomId)
                if (!room) return null
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    room={room}
                    assignedToName={getUserName(task.assignedTo)}
                    onClick={handleTaskClick}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            进行中
          </h2>
          {inProgressTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white py-8 text-center text-sm text-gray-400">
              暂无进行中任务
            </div>
          ) : (
            <div className="space-y-3">
              {inProgressTasks.map((task) => {
                const room = getRoom(task.roomId)
                if (!room) return null
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    room={room}
                    assignedToName={getUserName(task.assignedTo)}
                    onClick={handleTaskClick}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {pendingMinibarChecks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <Wine size={16} className="text-amber-600" />
            待核对迷你吧
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {pendingMinibarChecks.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pendingMinibarChecks.map((check) => {
              const room = getRoom(check.roomId)
              if (!room) return null
              const task = myTasks.find((t) => t.id === check.taskId)
              return (
                <div
                  key={check.id}
                  onClick={() => {
                    if (task) navigate(`/attendant/minibar/${task.id}`)
                  }}
                  className="cursor-pointer rounded-lg border border-amber-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                        <Wine size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-[#1E3A5F]">
                            {room.number}
                          </span>
                          <StatusBadge status="pending" category="minibar" />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                          <Clock size={10} />
                          <span>查房已完成，待迷你吧核对</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-2 text-xs text-amber-600">
                    {check.items.length} 项商品待核对
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
