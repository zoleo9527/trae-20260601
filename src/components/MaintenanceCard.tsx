import type { MaintenanceCategory, MaintenanceOrder, Room } from '@/types'
import StatusBadge from './StatusBadge'
import { Clock, AlertTriangle } from 'lucide-react'

interface MaintenanceCardProps {
  order: MaintenanceOrder
  room: Room
  onClick: (orderId: string) => void
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

export default function MaintenanceCard({ order, room, onClick }: MaintenanceCardProps) {
  const priority = priorityMap[order.priority] ?? priorityMap.low
  const category = order.category ? categoryMap[order.category] : null

  return (
    <div
      onClick={() => onClick(order.id)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
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
        </div>
        <StatusBadge status={order.status} category="maintenance" />
      </div>
      <p className="mt-1 line-clamp-1 text-sm text-gray-600">{order.description}</p>
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <Clock size={12} />
        <span>{formatTime(order.createdAt)}</span>
      </div>
    </div>
  )
}
