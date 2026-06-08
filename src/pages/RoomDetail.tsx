import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline, formatTime } from '@/components/Timeline'
import { ArrowLeft, DoorOpen } from 'lucide-react'

interface RoomInfo {
  id: number
  room_number: string
  floor: number
  status: string
  current_assignee_id: number | null
  assignee_name: string | null
  last_changed_at: string
}

interface Repair {
  id: number
  room_id: number
  fault_type: string
  description: string
  urgency: string
  status: string
  created_by: number
  creator_name: string
  assigned_to: number | null
  assignee_name: string | null
  created_at: string
  completed_at: string | null
}

interface Recovery {
  id: number
  room_id: number
  status: string
  cleaner_id: number | null
  cleaner_name: string | null
  supervisor_id: number | null
  supervisor_name: string | null
  created_at: string
  completed_at: string | null
}

const faultTypeLabels: Record<string, string> = {
  plumbing: '水管',
  electrical: '电气',
  furniture: '家具',
  ac: '空调',
  door: '门窗',
  other: '其他',
}

export default function RoomDetail() {
  const { id } = useParams()
  const [data, setData] = useState<{
    room: RoomInfo
    repairs: Repair[]
    recoveries: Recovery[]
  } | null>(null)
  const [repairLogs, setRepairLogs] = useState<Record<number, any[]>>({})
  const [recoveryLogs, setRecoveryLogs] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get<any>(`/rooms/${id}`)
      .then(async (d) => {
        setData(d)
        const rLogs: Record<number, any[]> = {}
        const vLogs: Record<number, any[]> = {}
        for (const r of d.repairs.slice(0, 5)) {
          try {
            rLogs[r.id] = await api.get<any[]>(`/repairs/${r.id}/logs`)
          } catch {}
        }
        for (const r of d.recoveries.slice(0, 5)) {
          try {
            vLogs[r.id] = await api.get<any[]>(`/recovery/${r.id}/logs`)
          } catch {}
        }
        setRepairLogs(rLogs)
        setRecoveryLogs(vLogs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
  }
  if (!data) return <div className="text-[#6b7084] text-sm py-10 text-center">房间不存在</div>

  const { room, repairs, recoveries } = data

  return (
    <div>
      <Link to="/rooms" className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7084] hover:text-[#e8723a] mb-4 transition-colors">
        <ArrowLeft size={13} />
        返回房态看板
      </Link>

      <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#1a1d28] flex items-center justify-center">
            <DoorOpen size={20} className="text-[#e8723a]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#e4e6eb] font-mono">{room.room_number}</h1>
              <StatusBadge status={room.status} type="room" />
            </div>
            <div className="text-[12px] text-[#6b7084] mt-0.5">
              {room.floor}F · {room.assignee_name || '无负责人'} · 最后变更 {formatTime(room.last_changed_at)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <h2 className="text-[14px] font-semibold text-[#e4e6eb] mb-3">报修记录</h2>
          {repairs.length === 0 ? (
            <div className="text-[12px] text-[#4a4e5e] py-4 text-center">暂无报修记录</div>
          ) : (
            <div className="space-y-3">
              {repairs.map((r) => (
                <div key={r.id} className="bg-[#0d0f14] rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/repairs/${r.id}`} className="text-[13px] font-medium text-[#e4e6eb] hover:text-[#e8723a] transition-colors">
                      报修单 #{r.id}
                    </Link>
                    <StatusBadge status={r.status} type="repair" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#6b7084] mb-2">
                    <span>{faultTypeLabels[r.fault_type] || r.fault_type}</span>
                    <span>·</span>
                    <StatusBadge status={r.urgency} type="urgency" />
                    <span>·</span>
                    <span>{r.creator_name}</span>
                  </div>
                  {r.description && (
                    <div className="text-[11px] text-[#8b8fa3] mb-2">{r.description}</div>
                  )}
                  {repairLogs[r.id] && repairLogs[r.id].length > 0 && (
                    <div className="border-t border-[#1e2230] pt-2 mt-2">
                      <Timeline entries={repairLogs[r.id]} type="repair" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <h2 className="text-[14px] font-semibold text-[#e4e6eb] mb-3">恢复记录</h2>
          {recoveries.length === 0 ? (
            <div className="text-[12px] text-[#4a4e5e] py-4 text-center">暂无恢复记录</div>
          ) : (
            <div className="space-y-3">
              {recoveries.map((r) => (
                <div key={r.id} className="bg-[#0d0f14] rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/recovery/${r.id}`} className="text-[13px] font-medium text-[#e4e6eb] hover:text-[#e8723a] transition-colors">
                      恢复流程 #{r.id}
                    </Link>
                    <StatusBadge status={r.status} type="recovery" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#6b7084] mb-2">
                    {r.cleaner_name && <span>保洁: {r.cleaner_name}</span>}
                    {r.supervisor_name && <><span>·</span><span>主管: {r.supervisor_name}</span></>}
                  </div>
                  {recoveryLogs[r.id] && recoveryLogs[r.id].length > 0 && (
                    <div className="border-t border-[#1e2230] pt-2 mt-2">
                      <Timeline entries={recoveryLogs[r.id]} type="recovery" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
