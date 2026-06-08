import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline, formatTime } from '@/components/Timeline'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle } from 'lucide-react'

interface RecoveryFlow {
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

interface LogEntry {
  id: number
  recovery_flow_id: number
  action: string
  operator_id: number
  operator_name: string
  note: string | null
  created_at: string
}

const stepLabels: Record<string, string> = {
  pending_clean: '待保洁',
  pending_inspect: '待检查',
  recovered: '已恢复',
}

export default function RecoveryDetail() {
  const { id } = useParams()
  const [flow, setFlow] = useState<RecoveryFlow | null>(null)
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
      api.get<RecoveryFlow>(`/recovery/${id}`),
      api.get<LogEntry[]>(`/recovery/${id}/logs`),
    ])
      .then(([flowData, logsData]) => {
        setFlow(flowData)
        setLogs(logsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleCleanComplete = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.patch(`/recovery/${id}/clean-complete`, { note: note || '保洁完成' })
      setNote('')
      window.location.reload()
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.patch(`/recovery/${id}/approve`, { note: note || '检查通过' })
      setNote('')
      window.location.reload()
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!id) return
    if (!note.trim()) {
      setActionError('驳回必须填写原因')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      await api.patch(`/recovery/${id}/reject`, { note })
      setNote('')
      window.location.reload()
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
  }
  if (!flow) return <div className="text-[#6b7084] text-sm py-10 text-center">流程不存在</div>

  const canCleanComplete = user?.role === 'cleaner' && flow.status === 'pending_clean' && flow.cleaner_id === user?.id
  const canApprove = user?.role === 'supervisor' && flow.status === 'pending_inspect'

  const steps = ['pending_clean', 'pending_inspect', 'recovered']
  const currentStepIndex = steps.indexOf(flow.status)

  return (
    <div className="max-w-2xl">
      <Link to="/recovery" className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7084] hover:text-[#e8723a] mb-4 transition-colors">
        <ArrowLeft size={13} />
        返回恢复列表
      </Link>

      <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a1d28] flex items-center justify-center">
              <RotateCcw size={18} className="text-[#3a86c8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#e4e6eb]">恢复流程 #{flow.id}</h1>
                <StatusBadge status={flow.status} type="recovery" />
              </div>
              <div className="text-[12px] text-[#6b7084] mt-0.5">房间 {flow.room_number}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-5">
          {steps.map((step, i) => (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex-1">
                <div className={`h-1.5 rounded-full ${
                  i <= currentStepIndex
                    ? i === currentStepIndex
                      ? 'bg-[#e8723a]'
                      : 'bg-emerald-500'
                    : 'bg-[#2a2f42]'
                }`} />
                <div className={`text-[10px] mt-1 ${
                  i <= currentStepIndex ? 'text-[#e4e6eb]' : 'text-[#4a4e5e]'
                }`}>
                  {stepLabels[step]}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">保洁员</div>
            <div className="text-[13px] text-[#e4e6eb]">{flow.cleaner_name || '-'}</div>
          </div>
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">主管</div>
            <div className="text-[13px] text-[#e4e6eb]">{flow.supervisor_name || '-'}</div>
          </div>
          <div className="bg-[#0d0f14] rounded-md p-3">
            <div className="text-[11px] text-[#6b7084] mb-1">创建时间</div>
            <div className="text-[13px] text-[#e4e6eb]">{formatTime(flow.created_at)}</div>
          </div>
        </div>
      </div>

      {(canCleanComplete || canApprove) && (
        <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5 mb-4">
          <h3 className="text-[13px] font-medium text-[#e4e6eb] mb-3">
            {canCleanComplete ? '标记保洁完成' : '审核恢复流程'}
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
            placeholder={canCleanComplete ? '保洁备注（可选）' : canApprove ? '审核意见（驳回时必填）' : ''}
            className="w-full px-3 py-2 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] placeholder-[#4a4e5e] focus:outline-none focus:border-[#e8723a]/50 resize-none mb-3"
          />
          <div className="flex gap-2">
            {canCleanComplete && (
              <button
                onClick={handleCleanComplete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium bg-[#e8723a] text-white hover:bg-[#d4662f] disabled:opacity-40 transition-colors"
              >
                <CheckCircle size={13} />
                保洁完成
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle size={13} />
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !note.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[12px] font-medium bg-red-600/80 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  <XCircle size={13} />
                  驳回
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#151822] rounded-lg border border-[#1e2230] p-5">
        <h3 className="text-[14px] font-semibold text-[#e4e6eb] mb-4">操作时间线</h3>
        <Timeline entries={logs} type="recovery" />
      </div>
    </div>
  )
}
