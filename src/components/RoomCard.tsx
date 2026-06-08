import type { Room } from '@/types'
import StatusBadge from './StatusBadge'
import { User } from 'lucide-react'

interface RoomCardProps {
  room: Room
  onClick: (roomId: string) => void
}

const borderColorMap: Record<string, string> = {
  dirty: 'border-l-gray-400',
  clean: 'border-l-emerald-500',
  occupied: 'border-l-blue-500',
  inspecting: 'border-l-amber-500',
  maintenance: 'border-l-red-500',
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  return (
    <div
      onClick={() => onClick(room.id)}
      className={`cursor-pointer rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${borderColorMap[room.status] ?? 'border-l-gray-300'}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-serif text-2xl font-bold text-[#1E3A5F]">{room.number}</span>
        <StatusBadge status={room.status} category="room" />
      </div>
      <div className="mt-2 text-sm text-gray-500">{room.floor}层</div>
      {room.status === 'occupied' && room.currentGuest && (
        <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
          <User size={14} />
          <span>{room.currentGuest}</span>
        </div>
      )}
    </div>
  )
}
