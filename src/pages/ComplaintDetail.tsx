import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Play, Send, XCircle, Check, RotateCcw, AlertTriangle, FileSearch, Shield } from 'lucide-react'
import { getComplaintDetail, updateComplaint, getUsers, createEvidenceReview, updateEvidenceReview } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import EvidencePanel from '@/components/EvidencePanel'
import { COMPLAINT_TYPE_LABELS, USER_ROLE_LABELS, EVIDENCE_REVIEW_STATUS_LABELS, STUCK_POINT_LABELS } from '../../shared/types'
import type { ComplaintDetail, User, UserRole, EvidenceReviewStatus } from '../../shared/types'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const reviewStatusColors: Record<EvidenceReviewStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  blocked: 'bg-red-500/20 text-red-400',
}

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [detail, setDetail] = useState<ComplaintDetail | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [showAppealInput, setShowAppealInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewReviewerId, setReviewReviewerId] = useState<number | null>(null)
  const [reviewStatus, setReviewStatus] = useState<EvidenceReviewStatus>('pending')
  const [blockedReason, setBlockedReason] = useState('')

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getComplaintDetail(Number(id))
      setDetail(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
    getUsers().then(setUsers).catch(() => {})
  }, [fetchDetail])

  const handleAction = async (action: string) => {
    if (!detail) return
    try {
      const data: { status?: string; assigneeId?: number; appealReason?: string } = {}

      switch (action) {
        case 'assign':
          if (!assigneeId) return
          data.status = 'assigned'
          data.assigneeId = assigneeId
          break
        case 'start_process':
          data.status = 'processing'
          break
        case 'appeal':
          data.status = 'appealing'
          if (appealReason) data.appealReason = appealReason
          break
        case 'close':
          data.status = 'closed'
          break
        case 'approve':
          data.status = 'closed'
          break
        case 'reject':
          data.status = 'rejected'
          break
        case 'reassign':
          if (!assigneeId) return
          data.status = 'assigned'
          data.assigneeId = assigneeId
          break
      }

      await updateComplaint(detail.id, data)
      setShowAppealInput(false)
      setAppealReason('')
      fetchDetail()
    } catch {
      // ignore
    }
  }

  const handleCreateReview = async () => {
    if (!detail || !reviewReviewerId) return
    try {
      await createEvidenceReview({
        complaintId: detail.id,
        reviewerId: reviewReviewerId,
        status: reviewStatus,
        blockedReason: reviewStatus === 'blocked' ? blockedReason : undefined,
      })
      setShowReviewModal(false)
      setReviewReviewerId(null)
      setReviewStatus('pending')
      setBlockedReason('')
      fetchDetail()
    } catch {
      // ignore
    }
  }

  const handleUpdateReview = async (status: EvidenceReviewStatus) => {
    if (!detail?.evidence_review) return
    try {
      await updateEvidenceReview(detail.evidence_review.id, {
        status,
        blockedReason: status === 'blocked' ? blockedReason : undefined,
      })
      setBlockedReason('')
      fetchDetail()
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <div className="text-park-muted text-center py-20">加载中...</div>
  }

  if (!detail) {
    return <div className="text-park-muted text-center py-20">工单不存在</div>
  }

  const isOperations = user?.role === 'operations'
  const isCustomerService = user?.role === 'customer_service'
  const isMaintenance = user?.role === 'maintenance'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/complaints')}
          className="flex items-center gap-1 text-park-muted hover:text-park-text transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {detail.status === 'pending' && isOperations && (
            <>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                className="bg-park-bg border border-park-border rounded px-2 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">选择责任人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({USER_ROLE_LABELS[u.role as UserRole]})</option>
                ))}
              </select>
              <button
                onClick={() => handleAction('assign')}
                disabled={!assigneeId}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                分配
              </button>
            </>
          )}
          {detail.status === 'assigned' && (isOperations || (detail.assignee_id === user?.id)) && (
            <button
              onClick={() => handleAction('start_process')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              <Play className="w-4 h-4" />
              开始处理
            </button>
          )}
          {detail.status === 'processing' && (isCustomerService || isMaintenance || detail.assignee_id === user?.id) && (
            <>
              {!showAppealInput ? (
                <button
                  onClick={() => setShowAppealInput(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                  提交申诉
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="申诉理由"
                    className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber w-48"
                  />
                  <button
                    onClick={() => handleAction('appeal')}
                    className="px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    确认申诉
                  </button>
                  <button
                    onClick={() => { setShowAppealInput(false); setAppealReason('') }}
                    className="px-3 py-1.5 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
              <button
                onClick={() => handleAction('close')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
                关闭
              </button>
            </>
          )}
          {detail.status === 'appealing' && isOperations && (
            <>
              <button
                onClick={() => handleAction('approve')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Check className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                退回
              </button>
            </>
          )}
          {detail.status === 'rejected' && isOperations && (
            <>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                className="bg-park-bg border border-park-border rounded px-2 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">选择责任人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({USER_ROLE_LABELS[u.role as UserRole]})</option>
                ))}
              </select>
              <button
                onClick={() => handleAction('reassign')}
                disabled={!assigneeId}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                重新分配
              </button>
            </>
          )}
        </div>
      </div>

      {detail.stuck_point && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-medium text-sm">
              卡点: {STUCK_POINT_LABELS[detail.stuck_point] || detail.stuck_point}
            </div>
            <div className="text-red-300/70 text-xs mt-1">
              {detail.stuck_point === 'unassigned' && '该工单尚未分配责任人，请运营专员尽快分配。'}
              {detail.stuck_point === 'no_evidence' && '证据回查尚未开始，需指定回查人员并启动回查流程。'}
              {detail.stuck_point === 'evidence_blocked' && `证据回查受阻: ${detail.evidence_review?.blocked_reason || '原因未知'}，需协调解决。`}
              {detail.stuck_point === 'appeal_pending' && '申诉正在等待运营专员审核，请尽快处理。'}
              {detail.stuck_point === 'overdue_processing' && '该工单已超过截止时间仍未关闭，请加快处理。'}
              {detail.stuck_point === 'no_progress' && '该工单长时间无进展，请关注推进。'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-park-card rounded-lg border border-park-border p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-lg font-semibold text-park-text">{detail.complaint_no}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-park-hover text-park-text text-xs">
            {COMPLAINT_TYPE_LABELS[detail.type]}
          </span>
          <StatusBadge status={detail.status} />
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-park-muted">车牌号：</span>
            <span className="text-park-text">{detail.plate_number || '-'}</span>
          </div>
          <div>
            <span className="text-park-muted">负责人：</span>
            <span className="text-park-text">{detail.assignee_name || '-'}</span>
          </div>
          <div>
            <span className="text-park-muted">创建时间：</span>
            <span className="text-park-text">{formatTime(detail.created_at)}</span>
          </div>
          <div>
            <span className="text-park-muted">更新时间：</span>
            <span className="text-park-text">{formatTime(detail.updated_at)}</span>
          </div>
          <div>
            <span className="text-park-muted">截止时间：</span>
            <span className={detail.is_overdue ? 'text-red-400 font-medium' : 'text-park-text'}>
              {formatTime(detail.deadline)}
              {detail.is_overdue && ' (已逾期)'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-park-muted">描述：</span>
            <span className="text-park-text">{detail.description}</span>
          </div>
        </div>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-medium text-park-text">证据回查状态</h2>
          </div>
          {!detail.evidence_review && detail.status !== 'closed' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
            >
              <FileSearch className="w-4 h-4" />
              发起回查
            </button>
          )}
          {detail.evidence_review && detail.evidence_review.status !== 'completed' && (
            <div className="flex items-center gap-2">
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as EvidenceReviewStatus)}
                className="bg-park-bg border border-park-border rounded px-2 py-1 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="in_progress">回查中</option>
                <option value="completed">已完成</option>
                <option value="blocked">受阻</option>
              </select>
              {reviewStatus === 'blocked' && (
                <input
                  type="text"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="受阻原因"
                  className="bg-park-bg border border-park-border rounded px-3 py-1 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber w-48"
                />
              )}
              <button
                onClick={() => handleUpdateReview(reviewStatus)}
                className="px-3 py-1.5 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
              >
                更新状态
              </button>
            </div>
          )}
        </div>
        {detail.evidence_review ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-park-muted">回查人：</span>
              <span className="text-park-text">{detail.evidence_review.reviewer_name || '-'}</span>
            </div>
            <div>
              <span className="text-park-muted">回查状态：</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${reviewStatusColors[detail.evidence_review.status]}`}>
                {EVIDENCE_REVIEW_STATUS_LABELS[detail.evidence_review.status]}
              </span>
            </div>
            {detail.evidence_review.blocked_reason && (
              <div className="col-span-2">
                <span className="text-park-muted">受阻原因：</span>
                <span className="text-red-400">{detail.evidence_review.blocked_reason}</span>
              </div>
            )}
            {detail.evidence_review.completed_at && (
              <div>
                <span className="text-park-muted">完成时间：</span>
                <span className="text-park-text">{formatTime(detail.evidence_review.completed_at)}</span>
              </div>
            )}
            <div>
              <span className="text-park-muted">创建时间：</span>
              <span className="text-park-text">{formatTime(detail.evidence_review.created_at)}</span>
            </div>
          </div>
        ) : (
          <div className="text-park-muted text-sm py-2">
            尚未发起证据回查，请点击"发起回查"按钮指定回查人员。
          </div>
        )}
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-park-card rounded-lg border border-park-border p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-park-text mb-4">发起证据回查</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-park-muted mb-1 block">回查人员</label>
                <select
                  value={reviewReviewerId ?? ''}
                  onChange={(e) => setReviewReviewerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                >
                  <option value="">选择回查人员</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({USER_ROLE_LABELS[u.role as UserRole]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-park-muted mb-1 block">初始状态</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as EvidenceReviewStatus)}
                  className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text outline-none focus:border-park-amber"
                >
                  <option value="pending">待回查</option>
                  <option value="in_progress">回查中</option>
                  <option value="blocked">受阻</option>
                </select>
              </div>
              {reviewStatus === 'blocked' && (
                <div>
                  <label className="text-sm text-park-muted mb-1 block">受阻原因</label>
                  <input
                    type="text"
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    placeholder="请输入受阻原因"
                    className="w-full bg-park-bg border border-park-border rounded px-3 py-2 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowReviewModal(false); setReviewReviewerId(null); setReviewStatus('pending'); setBlockedReason('') }}
                  className="px-4 py-2 text-sm rounded bg-park-hover text-park-muted hover:text-park-text transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateReview}
                  disabled={!reviewReviewerId}
                  className="px-4 py-2 text-sm rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white transition-colors"
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-park-card rounded-lg border border-park-border p-5">
          <h2 className="text-sm font-medium text-park-text mb-4">操作时间线</h2>
          <Timeline events={detail.timeline} stuckPoint={detail.stuck_point} />
        </div>
        <EvidencePanel evidence={detail.evidence} />
      </div>
    </div>
  )
}
