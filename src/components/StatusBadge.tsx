import type { RoomStatus, InspectionTaskStatus, MinibarCheckStatus, MaintenanceStatus } from '@/types'

type StatusCategory = 'room' | 'inspection' | 'minibar' | 'maintenance'

interface StatusBadgeProps {
  status: string
  category: StatusCategory
}

const roomMap: Record<RoomStatus, { label: string; className: string }> = {
  dirty: { label: '空脏', className: 'bg-gray-400 text-white' },
  clean: { label: '空净', className: 'bg-emerald-500 text-white' },
  occupied: { label: '住客', className: 'bg-blue-500 text-white' },
  inspecting: { label: '查房中', className: 'bg-amber-500 text-white' },
  maintenance: { label: '维修中', className: 'bg-red-500 text-white' },
}

const inspectionMap: Record<InspectionTaskStatus, { label: string; className: string }> = {
  pending: { label: '待分配', className: 'bg-gray-400 text-white' },
  assigned: { label: '已分配', className: 'bg-blue-500 text-white' },
  in_progress: { label: '查房中', className: 'bg-amber-500 text-white' },
  completed: { label: '已完成', className: 'bg-emerald-500 text-white' },
}

const minibarMap: Record<MinibarCheckStatus, { label: string; className: string }> = {
  pending: { label: '待核对', className: 'bg-gray-400 text-white' },
  checked: { label: '已核对', className: 'bg-emerald-500 text-white' },
  anomaly: { label: '异常', className: 'bg-amber-500 text-white' },
}

const maintenanceMap: Record<MaintenanceStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-red-500 text-white' },
  in_progress: { label: '处理中', className: 'bg-amber-500 text-white' },
  completed: { label: '已完成', className: 'bg-emerald-500 text-white' },
}

const maps = {
  room: roomMap,
  inspection: inspectionMap,
  minibar: minibarMap,
  maintenance: maintenanceMap,
}

export default function StatusBadge({ status, category }: StatusBadgeProps) {
  const map = maps[category] as Record<string, { label: string; className: string }>
  const config = map[status] ?? { label: status, className: 'bg-gray-400 text-white' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
