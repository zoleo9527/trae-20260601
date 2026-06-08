import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import { RefreshCw, Filter } from 'lucide-react'

interface Recovery {
  id: number
  room_id: number
  room_number: string
  status: string
  cleaner_id: number | null
  cleaner_name: string | null
  supervisor_id: number | null
  supervisor_name: string | null
  created_at: string
  clean_completed_at: string | null
  inspected_at: string | null
  completed_at: string | null
}

const statusLabels: Record<string, string> = {
  pending_clean: '待保洁',
  pending_inspect: '待检查',
  recovered: '已恢复',
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending_clean', label: '待保洁' },
  { value: 'pending_inspect', label: '待检查' },
  { value: 'recovered', label: '已恢复' },
]

export default function Recovery() {
  const [flows, setFlows] = useState<Recovery[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  const fetchFlows = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    api.get<Recovery[]>(`/recovery?${params.toString()}`)
      .then(setFlows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchFlows()
  }, [status])

  const handleCreate = async () => {
    const rooms = await api.get<any[]>('/rooms?status=cleaning')
    const cleaningRooms = rooms.filter((r: any) => r.status === 'cleaning' || r.status === 'repair')
    if (cleaningRooms.length === 0) {
      alert('当前没有可创建恢复流程的房间')
      return
    }
    const roomId = cleaningRooms[0].id
    try {
      await api.post('/recovery', { room_id: roomId })
      fetchFlows()
    } catch (err: any) {
      alert(err.message || '创建失败')
    }
  }

  const pendingClean = flows.filter((f) => f.status === 'pending_clean').length
  const pendingInspect = flows.filter((f) => f.status === 'pending_inspect').length

  const canCreate = user?.role === 'cleaner'
  const canApprove = user?.role === 'supervisor'
  const canCleanComplete = user?.role === 'cleaner'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#e4e6eb]">房态恢复</h1>
          <p className="text-[12px] text-[#6b7084] mt-0.5">
            {user?.role === 'cleaner' ? '你负责的恢复流程' : user?.role === 'supervisor' ? '待你检查的恢复流程' : '全部恢复流程'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#6b7084]" />
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
            onClick={fetchFlows}
            className="p-1.5 rounded-md bg-[#151822] border border-[#2a2f42] text-[#6b7084] hover:text-[#e4e6eb] transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-yellow-400">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          待保洁 {pendingClean}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-orange-400">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          待检查 {pendingInspect}
        </div>
      </div>

      {loading ? (
        <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
      ) : flows.length === 0 ? (
        <div className="text-[#4a4e5e] text-sm py-10 text-center">暂无恢复流程</div>
      ) : (
        <div className="space-y-2.5">
          {flows.map((f) => (
            <Link
              key={f.id}
              to={`/recovery/${f.id}`}
              className="flex items-center justify-between bg-[#151822] rounded-lg border border-[#1e2230] p-4 hover:bg-[#1a1d28] hover:border-[#2a2f42] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-mono font-semibold text-[#e4e6eb]">{f.room_number}</span>
                    <StatusBadge status={f.status} type="recovery" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6b7084]">
                    {f.cleaner_name && <span>保洁: {f.cleaner_name}</span>}
                    {f.supervisor_name && (
                      <>
                        <span>·</span>
                        <span>主管: {f.supervisor_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-[#4a4e5e]">{formatTime(f.created_at)}</div>
                <div className="text-[#4a4e5e] group-hover:text-[#e8723a] transition-colors">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
