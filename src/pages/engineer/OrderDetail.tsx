import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Clock, User, AlertTriangle, CheckCircle, Wrench, Wine } from 'lucide-react'
import { useAppStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: '低优先级', className: 'bg-emerald-100 text-emerald-700' },
  medium: { label: '中优先级', className: 'bg-amber-100 text-amber-700' },
  high: { label: '高优先级', className: 'bg-red-100 text-red-700' },
}

function formatDateTime(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { maintenanceOrders, rooms, inspectionTasks, inspectionResults, users, minibarChecks, updateMaintenanceOrder, currentUserId, assignMaintenanceOrder } = useAppStore()

  const order = maintenanceOrders.find((o) => o.id === orderId)
  const room = order ? rooms.find((r) => r.id === order.roomId) : undefined
  const task = order ? inspectionTasks.find((t) => t.id === order.taskId) : undefined
  const result = order ? inspectionResults.find((r) => r.taskId === order.taskId) : undefined
  const inspector = task?.assignedTo ? users.find((u) => u.id === task.assignedTo) : undefined

  const roomMinibarChecks = order
    ? minibarChecks.filter((c) => c.roomId === order.roomId)
    : []
  const hasPendingMinibar = roomMinibarChecks.some(
    (c) => c.status === 'pending' || c.status === 'anomaly'
  )

  if (!order || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Wrench size={48} />
        <p className="mt-4 text-lg">未找到工单信息</p>
        <button
          onClick={() => navigate('/engineer')}
          className="mt-4 rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm text-white transition-colors hover:bg-[#1E3A5F]/90"
        >
          返回工单列表
        </button>
      </div>
    )
  }

  const priority = priorityConfig[order.priority] ?? priorityConfig.low

  const handleClaim = () => {
    if (!currentUserId) return
    assignMaintenanceOrder(order.id, currentUserId)
  }

  const handleAction = (newStatus: 'in_progress' | 'completed') => {
    updateMaintenanceOrder(order.id, newStatus)
  }

  const isUnassigned = !order.assignedTo

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-gray-500">
        <button
          onClick={() => navigate('/engineer')}
          className="flex items-center gap-1 text-gray-600 transition-colors hover:text-[#1E3A5F]"
        >
          <ArrowLeft size={16} />
          维修工单
        </button>
        <ChevronRight size={14} />
        <span className="text-gray-900">{room.number} 维修</span>
      </nav>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#1E3A5F]">
            {room.number} - {room.floor}层
          </h2>
          <StatusBadge status={order.status} category="maintenance" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">问题描述</p>
              <p className="text-sm text-gray-700">{order.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="shrink-0 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">优先级</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}>
                {order.priority === 'high' && <AlertTriangle size={10} className="mr-1" />}
                {priority.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">创建时间</p>
              <p className="text-sm text-gray-700">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>

          {order.completedAt && (
            <div className="flex items-center gap-3">
              <CheckCircle size={16} className="shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs text-gray-400">完成时间</p>
                <p className="text-sm text-gray-700">{formatDateTime(order.completedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {task && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-medium text-gray-800">相关查房记录</h3>
          <div className="mt-3 space-y-2">
            {inspector && (
              <div className="flex items-center gap-3">
                <User size={16} className="shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">查房人员</p>
                  <p className="text-sm text-gray-700">{inspector.name}</p>
                </div>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">查房时间</p>
                  <p className="text-sm text-gray-700">{formatDateTime(task.completedAt)}</p>
                </div>
              </div>
            )}
            {result?.issues && (
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-gray-400">发现的问题</p>
                  <p className="text-sm text-gray-700">{result.issues}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {roomMinibarChecks.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-medium text-gray-800">
            <Wine size={16} className="text-[#D4A853]" />
            迷你吧核对状态
          </h3>
          <div className="mt-3 space-y-2">
            {roomMinibarChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <span className="text-sm text-gray-600">
                  {check.checkedAt ? formatDateTime(check.checkedAt) : '待核对'}
                </span>
                <StatusBadge status={check.status} category="minibar" />
              </div>
            ))}
            {hasPendingMinibar && order.status === 'in_progress' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                <AlertTriangle size={12} />
                迷你吧尚未完成核对，维修完成后房态将保持待定
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {isUnassigned && order.status === 'pending' && (
          <button
            onClick={handleClaim}
            className="flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#16304f]"
          >
            <User size={16} />
            领取工单
          </button>
        )}
        {!isUnassigned && order.status === 'pending' && (
          <button
            onClick={() => handleAction('in_progress')}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            <Wrench size={16} />
            开始维修
          </button>
        )}
        {order.status === 'in_progress' && (
          <button
            onClick={() => handleAction('completed')}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            <CheckCircle size={16} />
            完成维修
          </button>
        )}
        <button
          onClick={() => navigate('/engineer')}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          返回
        </button>
      </div>
    </div>
  )
}
