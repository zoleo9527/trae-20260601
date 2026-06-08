import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Filter, ClipboardCheck } from 'lucide-react'
import useStore from '@/store'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  vacant: { label: '空房', color: 'var(--color-vacant)', bg: '#f0fdf4' },
  occupied: { label: '入住', color: 'var(--color-occupied)', bg: '#eff6ff' },
  cleaning: { label: '清洁中', color: 'var(--color-cleaning)', bg: '#fffbeb' },
  inspecting: { label: '查房中', color: 'var(--color-inspecting)', bg: '#f5f3ff' },
  maintenance: { label: '维修中', color: 'var(--color-maintenance)', bg: '#fef2f2' },
}

export default function Rooms() {
  const navigate = useNavigate()
  const { rooms, fetchRooms, inspections, fetchInspections, createInspection } = useStore()
  const [floorFilter, setFloorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const filters: Record<string, string> = {}
    if (floorFilter) filters.floor = floorFilter
    if (statusFilter) filters.status = statusFilter
    fetchRooms(filters)
    fetchInspections()
  }, [floorFilter, statusFilter, fetchRooms, fetchInspections])

  const handleAssignInspection = async (roomId: number) => {
    await createInspection({ room_id: roomId, status: 'pending' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}
        >
          房态管理
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">全部楼层</option>
          <option value="3">3楼</option>
          <option value="4">4楼</option>
          <option value="5">5楼</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {rooms.map((room, idx) => {
          const s = STATUS_MAP[room.status] || STATUS_MAP.vacant
          return (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BedDouble size={18} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-lg font-bold">{room.room_number}</span>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {room.type}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                更新于 {new Date(room.updated_at).toLocaleString('zh-CN')}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAssignInspection(room.id)
                  }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#fef9ee',
                    color: 'var(--color-accent)',
                  }}
                >
                  <ClipboardCheck size={14} />
                  派单查房
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
