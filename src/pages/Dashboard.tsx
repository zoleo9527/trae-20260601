import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BedDouble,
  ClipboardCheck,
  Shirt,
  Wrench,
  PackageSearch,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react'
import useStore from '@/store'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  vacant: { label: '空房', color: 'var(--color-vacant)', bg: '#f0fdf4' },
  occupied: { label: '入住', color: 'var(--color-occupied)', bg: '#eff6ff' },
  cleaning: { label: '清洁中', color: 'var(--color-cleaning)', bg: '#fffbeb' },
  inspecting: { label: '查房中', color: 'var(--color-inspecting)', bg: '#f5f3ff' },
  maintenance: { label: '维修中', color: 'var(--color-maintenance)', bg: '#fef2f2' },
}

const FLOORS = [0, 3, 4, 5]

export default function Dashboard() {
  const navigate = useNavigate()
  const { rooms, fetchRooms, inspections, fetchInspections, maintenanceOrders, fetchMaintenance } =
    useStore()
  const [selectedFloor, setSelectedFloor] = useState(0)

  useEffect(() => {
    fetchRooms()
    fetchInspections()
    fetchMaintenance()
  }, [fetchRooms, fetchInspections, fetchMaintenance])

  const filteredRooms = selectedFloor
    ? rooms.filter((r) => r.floor === selectedFloor)
    : rooms

  const statusCounts = rooms.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const todayTasks = [
    ...inspections.map((i) => ({
      id: `i-${i.id}`,
      type: 'inspection' as const,
      icon: ClipboardCheck,
      label: '查房',
      roomNumber: i.room_number,
      assignee: i.inspector_name,
      deadline: i.scheduled_at,
      status: i.status,
    })),
    ...maintenanceOrders
      .filter((m) => m.status !== 'completed')
      .map((m) => ({
        id: `m-${m.id}`,
        type: 'maintenance' as const,
        icon: Wrench,
        label: '维修',
        roomNumber: m.room_number,
        assignee: m.assigned_name || m.reporter_name,
        deadline: m.created_at,
        status: m.status,
      })),
  ]

  const groupedTasks = todayTasks.reduce(
    (acc, t) => {
      const key = t.assignee || '未分配'
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    },
    {} as Record<string, typeof todayTasks>
  )

  const alertItems = [
    {
      severity: 'red',
      label: '布草短缺预警',
      count: 0,
      icon: Shirt,
      bgColor: '#fef2f2',
      borderColor: 'var(--color-maintenance)',
    },
    {
      severity: 'orange',
      label: '逾期未查房',
      count: inspections.filter((i) => i.status === 'overdue').length,
      icon: ClipboardCheck,
      bgColor: '#fff7ed',
      borderColor: 'var(--color-cleaning)',
    },
    {
      severity: 'yellow',
      label: '维修超时预警',
      count: maintenanceOrders.filter(
        (m) => m.status === 'pending' || m.status === 'in_progress'
      ).length,
      icon: Wrench,
      bgColor: '#fefce8',
      borderColor: 'var(--color-accent)',
    },
  ]

  return (
    <div className="space-y-8">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}
      >
        工作台
      </h1>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
            房态看板
          </h2>
          <div className="flex items-center gap-4">
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: val.color }}
                />
                {val.label}
                <span className="font-semibold" style={{ color: val.color }}>
                  {statusCounts[key] || 0}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {FLOORS.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className="px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{
                backgroundColor: selectedFloor === f ? 'var(--color-primary)' : '#f3f4f6',
                color: selectedFloor === f ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {f === 0 ? '全部' : `${f}楼`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-3">
          {filteredRooms.map((room, idx) => {
            const s = STATUS_MAP[room.status] || STATUS_MAP.vacant
            return (
              <button
                key={room.id}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 ease-out hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: s.bg,
                  borderLeft: `3px solid ${s.color}`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <span className="text-sm font-bold" style={{ color: s.color }}>
                  {room.room_number}
                </span>
                <span className="text-xs mt-1" style={{ color: s.color }}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
            今日待办
          </h2>
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              暂无待办事项
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTasks).map(([assignee, tasks]) => (
                <div key={assignee}>
                  <h3
                    className="text-sm font-medium mb-2 pb-1 border-b"
                    style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
                  >
                    {assignee}
                  </h3>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:shadow-sm transition-shadow"
                        style={{ backgroundColor: 'var(--color-bg)' }}
                      >
                        <task.icon size={16} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-sm font-medium">{task.label}</span>
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          {task.roomNumber}
                        </span>
                        <div className="flex-1" />
                        <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {task.deadline ? new Date(task.deadline).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              task.status === 'completed' ? '#f0fdf4' : '#fffbeb',
                            color:
                              task.status === 'completed'
                                ? 'var(--color-vacant)'
                                : 'var(--color-cleaning)',
                          }}
                        >
                          {task.status === 'completed' ? '已完成' : '进行中'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
            预警提醒
          </h2>
          <div className="space-y-3">
            {alertItems.map((alert) => (
              <div
                key={alert.label}
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{
                  backgroundColor: alert.bgColor,
                  borderLeft: `3px solid ${alert.borderColor}`,
                }}
              >
                <alert.icon size={20} style={{ color: alert.borderColor }} />
                <div className="flex-1">
                  <span className="text-sm font-medium">{alert.label}</span>
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: alert.borderColor }}
                >
                  {alert.count}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
