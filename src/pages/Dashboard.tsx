import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import {
  AlertTriangle,
  Clock,
  Wrench,
  ArrowRight,
  Activity,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface UrgentRepair {
  id: number
  room_number: string
  fault_type: string
  urgency: string
  status: string
  created_at: string
  assignee_name: string | null
}

interface BlockedRoom {
  id: number
  room_number: string
  floor: number
  status: string
  assignee_name: string | null
  last_changed_at: string
}

interface RecentActivity {
  id: number
  operator_name: string
  action_type: string
  detail: string
  created_at: string
}

interface DashboardData {
  pending_repairs: number
  urgent_repairs: UrgentRepair[]
  blocked_rooms: BlockedRoom[]
  recent_activities: RecentActivity[]
}

const faultTypeLabels: Record<string, string> = {
  plumbing: '水管',
  electrical: '电气',
  furniture: '家具',
  ac: '空调',
  door: '门窗',
  other: '其他',
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7084] text-sm">加载中...</div>
      </div>
    )
  }

  if (!data) return null

  const repairCount = data.pending_repairs
  const blockedCount = data.blocked_rooms.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#e4e6eb]">工作台</h1>
        <p className="text-[13px] text-[#6b7084] mt-0.5">
          {user?.name}，{getGreeting()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <span className="text-[13px] text-[#8b8fa3]">待处理报修</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400">{repairCount}</div>
          {repairCount > 0 && (
            <Link to="/repairs?status=pending" className="text-[11px] text-[#6b7084] hover:text-[#e8723a] mt-1 inline-flex items-center gap-1 transition-colors">
              查看待处理 <ArrowRight size={10} />
            </Link>
          )}
        </div>

        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-orange-500/15 flex items-center justify-center">
                <Clock size={16} className="text-orange-400" />
              </div>
              <span className="text-[13px] text-[#8b8fa3]">卡住房态</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-400">{blockedCount}</div>
          {blockedCount > 0 && (
            <Link to="/rooms" className="text-[11px] text-[#6b7084] hover:text-[#e8723a] mt-1 inline-flex items-center gap-1 transition-colors">
              查看房态板 <ArrowRight size={10} />
            </Link>
          )}
        </div>

        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-blue-500/15 flex items-center justify-center">
                <Zap size={16} className="text-blue-400" />
              </div>
              <span className="text-[13px] text-[#8b8fa3]">紧急报修</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400">{data.urgent_repairs.length}</div>
          {data.urgent_repairs.length > 0 && (
            <Link to="/repairs" className="text-[11px] text-[#6b7084] hover:text-[#e8723a] mt-1 inline-flex items-center gap-1 transition-colors">
              查看详情 <ArrowRight size={10} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#e4e6eb] flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400" />
              等待处理的报修
            </h2>
            <Link to="/repairs" className="text-[11px] text-[#e8723a] hover:underline flex items-center gap-1">
              全部 <ArrowRight size={10} />
            </Link>
          </div>
          {data.urgent_repairs.length === 0 ? (
            <div className="text-[13px] text-[#4a4e5e] py-6 text-center">暂无紧急报修</div>
          ) : (
            <div className="space-y-2">
              {data.urgent_repairs.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to={`/repairs/${r.id}`}
                  className="flex items-center justify-between p-2.5 rounded-md bg-[#0d0f14] hover:bg-[#1a1d28] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-mono text-[#e4e6eb]">{r.room_number}</span>
                    <span className="text-[12px] text-[#8b8fa3]">{faultTypeLabels[r.fault_type] || r.fault_type}</span>
                    <StatusBadge status={r.urgency} type="urgency" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#4a4e5e]">{formatTime(r.created_at)}</span>
                    <ArrowRight size={12} className="text-[#4a4e5e] group-hover:text-[#e8723a] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#e4e6eb] flex items-center gap-2">
              <Clock size={15} className="text-orange-400" />
              卡住房态
            </h2>
            <Link to="/rooms" className="text-[11px] text-[#e8723a] hover:underline flex items-center gap-1">
              房态板 <ArrowRight size={10} />
            </Link>
          </div>
          {data.blocked_rooms.length === 0 ? (
            <div className="text-[13px] text-[#4a4e5e] py-6 text-center">所有房间状态正常</div>
          ) : (
            <div className="space-y-2">
              {data.blocked_rooms.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to={`/rooms/${r.id}`}
                  className="flex items-center justify-between p-2.5 rounded-md bg-[#0d0f14] hover:bg-[#1a1d28] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-mono text-[#e4e6eb]">{r.room_number}</span>
                    <StatusBadge status={r.status} type="room" />
                  </div>
                  <div className="flex items-center gap-2">
                    {r.assignee_name && (
                      <span className="text-[11px] text-[#6b7084]">{r.assignee_name}</span>
                    )}
                    <ArrowRight size={12} className="text-[#4a4e5e] group-hover:text-[#e8723a] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-[#151822] rounded-lg border border-[#1e2230] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-[#e4e6eb] flex items-center gap-2">
            <Activity size={15} className="text-blue-400" />
            最近动态
          </h2>
        </div>
        {data.recent_activities.length === 0 ? (
          <div className="text-[13px] text-[#4a4e5e] py-6 text-center">暂无动态</div>
        ) : (
          <div className="space-y-0">
            {data.recent_activities.slice(0, 10).map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2 border-b border-[#1e2230] last:border-0"
              >
                <div className="w-6 h-6 rounded-full bg-[#1a1d28] flex items-center justify-center flex-shrink-0">
                  <Wrench size={10} className="text-[#6b7084]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[#e4e6eb]">{a.operator_name}</span>
                  <span className="text-[12px] text-[#8b8fa3] mx-1">·</span>
                  <span className="text-[12px] text-[#8b8fa3]">{actionTypeLabel(a.action_type)}</span>
                  {a.detail && (
                    <span className="text-[12px] text-[#6b7084] mx-1">—</span>
                  )}
                  {a.detail && (
                    <span className="text-[12px] text-[#6b7084] truncate">{a.detail}</span>
                  )}
                </div>
                <span className="text-[11px] text-[#4a4e5e] flex-shrink-0">{formatTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜班辛苦了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function actionTypeLabel(type: string) {
  const map: Record<string, string> = {
    repair_create: '创建报修',
    repair_accept: '接单',
    repair_complete: '完成维修',
    recovery_create: '创建恢复',
    recovery_clean_complete: '保洁完成',
    recovery_approve: '审核通过',
    recovery_reject: '审核驳回',
  }
  return map[type] || type
}
