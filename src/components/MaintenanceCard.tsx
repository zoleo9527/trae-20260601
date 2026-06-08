import type { MaintenanceCategory, MaintenanceOrder, Room } from '@/types'
import StatusBadge from './StatusBadge'
import { Clock, AlertTriangle, Timer } from 'lucide-react'

const PENDING_OVERTIME_MS = 2 * 60 * 60 * 1000
const IN_PROGRESS_OVERTIME_MS = 4 * 60 * 60 * 1000

interface MaintenanceCardProps {
  order: MaintenanceOrder
  room: Room
  onClick: (orderId: string) => void
  now?: number
}

const priorityMap: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-emerald-100 text-emerald-700' },
  medium: { label: '中', className: 'bg-amber-100 text-amber-700' },
  high: { label: '高', className: 'bg-red-100 text-red-700' },
}

const categoryMap: Record<MaintenanceCategory, { label: string; className: string }> = {
  leak: { label: '漏水', className: 'bg-blue-100 text-blue-700' },
  electrical: { label: '电器', className: 'bg-yellow-100 text-yellow-700' },
  furniture: { label: '家具', className: 'bg-orange-100 text-orange-700' },
  other: { label: '其他', className: 'bg-gray-100 text-gray-600' },
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatElapsed(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0) return m > 0 ? `${h}小时${m}分` : `${h}小时`
  return `${m}分钟`
}

export function isOrderOvertime(order: MaintenanceOrder, now: number): boolean {
  const elapsed = now - new Date(order.createdAt).getTime()
  if (order.status === 'pending' && !order.assignedTo) return elapsed > PENDING_OVERTIME_MS
  if (order.status === 'in_progress') return elapsed > IN_PROGRESS_OVERTIME_MS
  if (order.status === 'pending' && order.assignedTo) return elapsed > IN_PROGRESS_OVERTIME_MS
  return false
}

export { PENDING_OVERTIME_MS, IN_PROGRESS_OVERTIME_MS }

export default function MaintenanceCard({ order, room, onClick, now: nowProp }: MaintenanceCardProps) {
  const priority = priorityMap[order.priority] ?? priorityMap.low
  const category = order.category ? categoryMap[order.category] : null
  const now = nowProp ?? Date.now()
  const elapsed = now - new Date(order.createdAt).getTime()
  const isOvertime = isOrderOvertime(order, now)
  const isInProgress = order.status === 'in_progress' || (order.status === 'pending' && order.assignedTo)

  return (
    <div
      onClick={() => onClick(order.id)}
      className={`cursor-pointer rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md ${
        isOvertime
          ? 'border-red-300 bg-red-50/40'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-[#1E3A5F]">{room.number}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.className}`}>
            {order.priority === 'high' && <AlertTriangle size={10} className="mr-1" />}
            {priority.label}
          </span>
          {category && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${category.className}`}>
              {category.label}
            </span>
          )}
          {isOvertime && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              超时
            </span>
          )}
        </div>
        <StatusBadge status={order.status} category="maintenance" />
      </div>
      <p className="mt-1 line-clamp-1 text-sm text-gray-600">{order.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <Clock size={12} />
          <span>{formatTime(order.createdAt)}</span>
        </div>
        {isInProgress && (
          <div className={`flex items-center gap-1 ${isOvertime ? 'font-medium text-red-500' : 'text-gray-400'}`}>
            <Timer size={12} />
            <span>已处理 {formatElapsed(elapsed)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
