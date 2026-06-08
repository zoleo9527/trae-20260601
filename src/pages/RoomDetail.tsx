import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BedDouble, Clock, User, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  vacant: { label: '空房', color: 'var(--color-vacant)', bg: '#f0fdf4' },
  occupied: { label: '入住', color: 'var(--color-occupied)', bg: '#eff6ff' },
  cleaning: { label: '清洁中', color: 'var(--color-cleaning)', bg: '#fffbeb' },
  inspecting: { label: '查房中', color: 'var(--color-inspecting)', bg: '#f5f3ff' },
  maintenance: { label: '维修中', color: 'var(--color-maintenance)', bg: '#fef2f2' },
}

const STATUS_OPTIONS = ['vacant', 'occupied', 'cleaning', 'inspecting', 'maintenance']

export default function RoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rooms, fetchRooms, updateRoomStatus, currentUser } = useStore()
  const [room, setRoom] = useState<(typeof rooms)[0] | null>(null)

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    const found = rooms.find((r) => r.id === Number(id))
    if (found) setRoom(found)
  }, [rooms, id])

  const handleStatusChange = async (newStatus: string) => {
    if (!room || !currentUser) return
    await updateRoomStatus(room.id, newStatus, currentUser.id)
    await fetchRooms()
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <span style={{ color: 'var(--color-text-muted)' }}>加载中...</span>
      </div>
    )
  }

  const s = STATUS_MAP[room.status] || STATUS_MAP.vacant

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/rooms')}
        className="flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft size={16} />
        返回房间列表
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BedDouble size={28} style={{ color: 'var(--color-primary)' }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}
              >
                {room.room_number}
              </h1>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {room.type}
              </span>
            </div>
          </div>
          <span
            className="text-sm px-4 py-1.5 rounded-full font-medium"
            style={{ backgroundColor: s.bg, color: s.color }}
          >
            {s.label}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            切换状态
          </h3>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => {
              const st = STATUS_MAP[status]
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className="px-4 py-2 text-sm rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: room.status === status ? st.bg : 'transparent',
                    borderColor: room.status === status ? st.color : 'var(--color-border)',
                    color: room.status === status ? st.color : 'var(--color-text-muted)',
                  }}
                >
                  {st.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2
          className="text-lg font-semibold mb-6"
          style={{ color: 'var(--color-primary)' }}
        >
          操作记录
        </h2>
        {(!room.timeline || room.timeline.length === 0) ? (
          <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            暂无操作记录
          </div>
        ) : (
          <div className="relative pl-6">
            <div
              className="absolute left-2.5 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            {room.timeline.map((event, idx) => (
              <div key={event.id || idx} className="relative mb-6 last:mb-0">
                <div
                  className="absolute -left-4 top-1 w-4 h-4 rounded-full border-2 bg-white"
                  style={{ borderColor: 'var(--color-accent)' }}
                />
                <div className="ml-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(event.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm">{event.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <User size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {event.operator_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
