import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import { Plus, Filter, RefreshCw } from 'lucide-react'

interface Repair {
  id: number
  room_id: number
  room_number: string
  fault_type: string
  description: string
  urgency: string
  status: string
  created_by: number
  creator_name: string
  assigned_to: number | null
  assignee_name: string | null
  created_at: string
  assigned_at: string | null
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

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

export default function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  const fetchRepairs = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    api.get<Repair[]>(`/repairs?${params.toString()}`)
      .then(setRepairs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRepairs()
  }, [status])

  const canCreate = user?.role === 'cleaner' || user?.role === 'supervisor'
  const canAccept = user?.role === 'engineer'

  const pendingCount = repairs.filter((r) => r.status === 'pending').length
  const inProgressCount = repairs.filter((r) => r.status === 'in_progress').length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#e4e6eb]">工程报修</h1>
          <p className="text-[12px] text-[#6b7084] mt-0.5">
            {user?.role === 'engineer' ? '你负责的报修工单' : user?.role === 'cleaner' ? '你提交的报修工单' : '全部报修工单'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Link
              to="/repairs/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e8723a] text-white text-[12px] font-medium hover:bg-[#d4662f] transition-colors"
            >
              <Plus size={13} />
              提交报修
            </Link>
          )}
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
            onClick={fetchRepairs}
            className="p-1.5 rounded-md bg-[#151822] border border-[#2a2f42] text-[#6b7084] hover:text-[#e4e6eb] transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          待处理 {pendingCount}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-yellow-400">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          进行中 {inProgressCount}
        </div>
      </div>

      {loading ? (
        <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
      ) : repairs.length === 0 ? (
        <div className="text-[#4a4e5e] text-sm py-10 text-center">暂无报修工单</div>
      ) : (
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2230]">
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">房号</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">故障类型</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">描述</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">紧急度</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">状态</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">提交人</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">处理人</th>
                <th className="text-left text-[11px] font-medium text-[#6b7084] px-4 py-2.5">时间</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r) => (
                <tr key={r.id} className="border-b border-[#1e2230] last:border-0 hover:bg-[#1a1d28] transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/repairs/${r.id}`} className="text-[13px] font-mono font-medium text-[#e4e6eb] hover:text-[#e8723a] transition-colors">
                      {r.room_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#8b8fa3]">{faultTypeLabels[r.fault_type] || r.fault_type}</td>
                  <td className="px-4 py-3 text-[12px] text-[#8b8fa3] max-w-[200px] truncate">{r.description || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.urgency} type="urgency" /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} type="repair" /></td>
                  <td className="px-4 py-3 text-[12px] text-[#8b8fa3]">{r.creator_name}</td>
                  <td className="px-4 py-3 text-[12px] text-[#8b8fa3]">{r.assignee_name || '-'}</td>
                  <td className="px-4 py-3 text-[11px] text-[#4a4e5e]">{formatTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
