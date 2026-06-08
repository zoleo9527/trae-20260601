import { StatusBadge } from '@/components/StatusBadge'
import { Timeline, formatTime } from '@/components/Timeline'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, CheckCircle, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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

interface LogEntry {
  id: number
  repair_order_id: number
  action: string
  operator_id: number
  operator_name: string
  note: string | null
  created_at: string
}

const faultTypeLabels: Record<string, string> = {
  plumbing: '水管',
  electrical: '电气',
  furniture: '家具',
  ac: '空调',
  door: '门窗',
  other: '其他',
}

export default function RepairDetail() {
  const { id } = useParams()
  const [repair, setRepair] = useState<Repair | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState('')
  const { user } = useAuthStore()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<Repair>(`/repairs/${id}`),
      api.get<LogEntry[]>(`/repairs/${id}/logs`),
    ])
      .then(([repairData, logsData]) => {
        setRepair(repairData)
        setLogs(logsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAccept = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.patch(`/repairs/${id}/accept`, { note: note || '接单处理' })
      setNote('')
      window.location.reload()
    } catch (err: any) {
      setActionError(err.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.patch(`/repairs/${id}/complete`, { note: note || '维修完成' })
      setNote('')
      window.location.reload()
    } catch (err: any) {
      setActionError(err.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
  }
  if (!repair) return <div className="text-[#6b7084] text-sm py-10 text-center">工单不存在</div>

  const canAccept = user?.role === 'engineer' && repair.status === 'pending'
  const canComplete = user?.role === 'engineer' && repair.status === 'in_progress' && repair.assigned_to === user?.id
  const canAct = canAccept || canComplete

  return (
    <div className="max-w-2xl">
      <Link to="/repairs" className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7084] hover:text-[#e8723a] mb-4 transition-colors">
        <ArrowLeft size={13} />
        返回报修列表
      </Link>

      <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a1d28] flex items-center justify-center">
              <Wrench size={18} className="text-[#e8723a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#e4e6eb]">报修单 #{repair.id}</h1>
                <StatusBadge status={repair.status} type="repair" />
              </div>
              <div className="text-[12px] text-[#6b7084] mt-0.5">
                房间 {repair.room_number} · {faultTypeLabels[repair.fault_type] || repair.fault_type}
              </div>
            </div>
          </div>
          <StatusBadge status={repair.urgency} type="urgency" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">提交人</div>
            <div className="text-[13px] text-[#e4e6eb]">{repair.creator_name}</div>
          </div>
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">处理人</div>
            <div className="text-[13px] text-[#e4e6eb]">{repair.assignee_name || '待分配'}</div>
          </div>
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">创建时间</div>
            <div className="text-[13px] text-[#e4e6eb]">{formatTime(repair.created_at)}</div>
          </div>
        </div>

        {repair.description && (
          <div className="mt-3 bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">故障描述</div>
            <div className="text-[13px] text-[#e4e6eb]">{repair.description}</div>
          </div>
        )}
      </div>

      {canAct && (
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 mb-4">
          <h3 className="text-[13px] font-medium text-[#e4e6eb] mb-3">
            {canAccept ? '接单处理' : '标记完成'}
          </h3>
          {actionError && (
            <div className="mb-3 p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
              {actionError}
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={canAccept ? '接单备注（可选）' : '完成备注，描述维修情况'}
            className="w-full px-3 py-2 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] placeholder-[#4a4e5e] focus:outline-none focus:border-[#e8723a]/50 resize-none mb-3"
          />
          <div className="flex gap-2">
            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium bg-[#e8723a] text-white hover:bg-[#d4662f] disabled:opacity-40 transition-colors"
              >
                <CheckCircle size={13} />
                接单
              </button>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                <CheckCircle size={13} />
                标记完成
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5">
        <h3 className="text-[14px] font-semibold text-[#e4e6eb] mb-4">处理时间线</h3>
        <Timeline entries={logs} type="repair" />
      </div>
    </div>
  )
}
