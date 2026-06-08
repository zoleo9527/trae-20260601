import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import { Filter, RefreshCw } from 'lucide-react'

interface Room {
  id: number
  room_number: string
  floor: number
  status: string
  current_assignee_id: number | null
  assignee_name: string | null
  last_changed_at: string
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'vacant', label: '空房' },
  { value: 'occupied', label: '住客' },
  { value: 'cleaning', label: '清洁中' },
  { value: 'repair', label: '维修中' },
  { value: 'pending_inspect', label: '待检' },
]

const statusDotColor: Record<string, string> = {
  vacant: 'bg-emerald-500',
  occupied: 'bg-blue-500',
  cleaning: 'bg-yellow-500',
  repair: 'bg-red-500',
  pending_inspect: 'bg-orange-500',
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [floor, setFloor] = useState<number | ''>('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchRooms = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (floor !== '') params.set('floor', String(floor))
    if (status) params.set('status', status)
    api.get<Room[]>(`/rooms?${params.toString()}`)
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRooms()
  }, [floor, status])

  const floors = [...new Set(rooms.map((r) => r.floor))].sort()
  const allFloors = [3, 4, 5]

  const grouped = allFloors
    .filter((f) => floor === '' || f === floor)
    .map((f) => ({
      floor: f,
      rooms: rooms.filter((r) => r.floor === f),
    }))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#e4e6eb]">房态看板</h1>
          <p className="text-[12px] text-[#6b7084] mt-0.5">共 {rooms.length} 间</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#6b7084]" />
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value ? Number(e.target.value) : '')}
              className="bg-[#151822] border border-[#2a2f42] rounded-md text-[12px] text-[#e4e6eb] px-2 py-1.5 focus:outline-none focus:border-[#e8723a]/50"
            >
              <option value="">全部楼层</option>
              {allFloors.map((f) => (
                <option key={f} value={f}>{f}F</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#151822] border border-[#2a2f42] rounded-md text-[12px] text-[#e4e6eb] px-2 py-1.5 focus:outline-none focus:border-[#e8723a]/50"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchRooms}
            className="p-1.5 rounded-md bg-[#151822] border border-[#2a2f42] text-[#6b7084] hover:text-[#e4e6eb] transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {statusOptions.filter(s => s.value).map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(status === s.value ? '' : s.value)}
            className="flex items-center gap-1.5 text-[11px] text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${statusDotColor[s.value]}`} />
            {s.label}
            <span className="text-[#4a4e5e]">({rooms.filter(r => r.status === s.value).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ floor: f, rooms: floorRooms }) => (
            <div key={f}>
              <div className="text-[12px] font-medium text-[#6b7084] mb-2 flex items-center gap-2">
                <span className="bg-[#1a1d28] px-2 py-0.5 rounded text-[11px]">{f}F</span>
                <span className="text-[#4a4e5e]">{floorRooms.length} 间</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {floorRooms.map((room) => (
                  <Link
                    key={room.id}
                    to={`/rooms/${room.id}`}
                    className="bg-[#151822] rounded-lg border border-[#1e2230] p-3 hover:border-[#2a2f42] hover:bg-[#1a1d28] transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-mono font-semibold text-[#e4e6eb]">{room.room_number}</span>
                      <div className={`w-2 h-2 rounded-full ${statusDotColor[room.status] || 'bg-gray-500'} ${room.status === 'repair' ? 'animate-pulse' : ''}`} />
                    </div>
                    <StatusBadge status={room.status} type="room" />
                    {room.assignee_name && (
                      <div className="text-[11px] text-[#6b7084] mt-1.5 truncate">{room.assignee_name}</div>
                    )}
                    <div className="text-[10px] text-[#4a4e5e] mt-1">{formatTime(room.last_changed_at)}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
