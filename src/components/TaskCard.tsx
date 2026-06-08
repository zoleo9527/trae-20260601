import type { InspectionTask, Room } from '@/types'
import StatusBadge from './StatusBadge'
import { Clock, ChevronRight } from 'lucide-react'

interface TaskCardProps {
  task: InspectionTask
  room: Room
  assignedToName?: string
  onClick: (taskId: string) => void
}

const borderColorMap: Record<string, string> = {
  pending: 'border-l-gray-400',
  assigned: 'border-l-blue-500',
  in_progress: 'border-l-amber-500',
  completed: 'border-l-emerald-500',
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function TaskCard({ task, room, assignedToName, onClick }: TaskCardProps) {
  const showAction = task.status === 'assigned' || task.status === 'in_progress'

  return (
    <div
      onClick={() => onClick(task.id)}
      className={`cursor-pointer rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${borderColorMap[task.status] ?? 'border-l-gray-300'}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-serif text-xl font-bold text-[#1E3A5F]">{room.number}</span>
        <StatusBadge status={task.status} category="inspection" />
      </div>
      {assignedToName && (
        <div className="mt-1 text-sm text-gray-600">分配给：{assignedToName}</div>
      )}
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <Clock size={12} />
        <span>{formatTime(task.createdAt)}</span>
      </div>
      {showAction && (
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A5F]">
            查看详情
            <ChevronRight size={14} />
          </span>
        </div>
      )}
    </div>
  )
}
