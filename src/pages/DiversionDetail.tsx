import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, User, Users, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Role } from '@/stores/appStore'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'

type DiversionStatus = 'pending' | 'diverted' | 'confirmed' | 'completed' | 'rejected'

interface Diversion {
  id: string
  examNo: string
  patientName: string
  patientAge: number
  patientGender: string
  anomalyType: string[]
  urgency: string
  status: DiversionStatus
  assignedDept: string | null
  assignedDoctor: string | null
  createdAt: string
}

interface LogEntry {
  operatorRole: Role
  operatorName: string
  action: string
  detail: string
  createdAt: string
}

interface AttachmentItem {
  id: string
  fileName: string
  fileType: string
  fileUrl: string | null
  uploadedAt: string | null
  uploadedBy: string | null
}

const anomalyBadgeMap: Record<string, { label: string; className: string }> = {
  missing_material: { label: '缺材料', className: 'bg-red-50 text-red-600' },
  timeout: { label: '超时', className: 'bg-amber-50 text-amber-600' },
  review_failed: { label: '复核不通过', className: 'bg-red-50 text-red-600' },
}

const depts = ['内科', '外科', '妇科', '骨科', '心内科', '内分泌科', '超声科', '检验科', '放射科']
const doctors: Record<string, string[]> = {
  '内科': ['王医生', '陈医生'],
  '外科': ['李医生', '赵医生'],
  '妇科': ['陈医生', '刘医生'],
  '骨科': ['赵医生', '孙医生'],
  '心内科': ['张医生', '周医生'],
  '内分泌科': ['刘医生', '黄医生'],
  '超声科': ['杨医生', '吴医生'],
  '检验科': ['郑医生', '林医生'],
  '放射科': ['何医生', '马医生'],
}

export default function DiversionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole } = useAppStore()

  const [diversion, setDiversion] = useState<Diversion | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalDept, setModalDept] = useState('')
  const [modalDoctor, setModalDoctor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/diversions/${id}`).then((r) => r.json()),
      fetch(`/api/diversions/${id}/logs`).then((r) => r.json()),
      fetch(`/api/diversions/${id}/attachments`).then((r) => r.json()),
    ])
      .then(([divData, logsData, attachData]) => {
        setDiversion(divData)
        setLogs(Array.isArray(logsData) ? logsData : [])
        setAttachments(Array.isArray(attachData) ? attachData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (action: string, body?: Record<string, string>) => {
    if (!id) return
    setSubmitting(true)
    try {
      const operatorName = getOperatorName()
      const res = await fetch(`/api/diversions/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, operatorName }),
      })
      if (res.ok) {
        const updated = await fetch(`/api/diversions/${id}`).then((r) => r.json())
        setDiversion(updated)
        const updatedLogs = await fetch(`/api/diversions/${id}/logs`).then((r) => r.json())
        setLogs(Array.isArray(updatedLogs) ? updatedLogs : [])
        const updatedAttachments = await fetch(`/api/diversions/${id}/attachments`).then((r) => r.json())
        setAttachments(Array.isArray(updatedAttachments) ? updatedAttachments : [])
      }
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const getOperatorName = () => {
    const roleMap: Record<string, string> = {
      front_desk: '前台导检员',
      doctor: '科室医生',
      reviewer: '报告审核员',
    }
    return roleMap[currentRole] || '未知操作员'
  }

  const handleSubmitDiversion = () => {
    if (!modalDept) return
    handleAction('divert', { assignedDept: modalDept, assignedDoctor: modalDoctor })
    setShowModal(false)
    setModalDept('')
    setModalDoctor('')
  }

  const handleReject = () => {
    if (!rejectReason) return
    handleAction('reject', { reason: rejectReason })
    setShowRejectModal(false)
    setRejectReason('')
  }

  const handleUpload = (attachmentId?: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !id) return
      try {
        const operatorName = getOperatorName()
        const res = await fetch(`/api/diversions/${id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, operatorName, attachmentId }),
        })
        if (res.ok) {
          const updated = await fetch(`/api/diversions/${id}/attachments`).then((r) => r.json())
          setAttachments(Array.isArray(updated) ? updated : [])
          const updatedLogs = await fetch(`/api/diversions/${id}/logs`).then((r) => r.json())
          setLogs(Array.isArray(updatedLogs) ? updatedLogs : [])
        }
      } catch {}
    }
    input.click()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  if (!diversion) {
    return <div className="flex items-center justify-center h-64 text-gray-400">未找到该分流记录</div>
  }

  const showDivertBtn = currentRole === 'front_desk' && (diversion.status === 'pending' || diversion.status === 'rejected')
  const showConfirmBtn = currentRole === 'doctor' && diversion.status === 'diverted'
  const showCompleteBtn = currentRole === 'doctor' && diversion.status === 'confirmed'
  const showReviewBtn = currentRole === 'reviewer' && diversion.status === 'completed'

  const flowSteps = [
    { key: 'pending', label: '前台提交', icon: <User className="w-4 h-4" />, role: '前台导检' },
    { key: 'diverted', label: '导检分流', icon: <Users className="w-4 h-4" />, role: '前台导检' },
    { key: 'confirmed', label: '科室确认', icon: <User className="w-4 h-4" />, role: '科室医生' },
    { key: 'completed', label: '检查完成', icon: <CheckCircle className="w-4 h-4" />, role: '科室医生' },
    { key: 'approved', label: '审核通过', icon: <FileCheck className="w-4 h-4" />, role: '报告审核员' },
  ]

  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['pending', 'diverted', 'confirmed', 'completed', 'approved']
    const displayStatus = diversion.status === 'rejected' ? 'pending' : diversion.status
    const currentIdx = statusOrder.indexOf(displayStatus)
    const stepIdx = statusOrder.indexOf(stepKey)
    if (stepIdx < currentIdx) return 'done'
    if (stepIdx === currentIdx) return 'active'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-warm-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">分流详情</h1>
      </div>

      <div className="bg-white rounded-lg border border-warm-300 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">交接流程</h3>
        <div className="flex items-center justify-between">
          {flowSteps.map((step, idx) => {
            const status = getStepStatus(step.key)
            return (
              <div key={step.key} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors',
                      status === 'done' && 'bg-emerald-100 text-emerald-600',
                      status === 'active' && 'bg-primary text-white',
                      status === 'pending' && 'bg-gray-100 text-gray-400',
                      diversion.status === 'rejected' && step.key === 'pending' && 'bg-red-100 text-red-600'
                    )}
                  >
                    {step.icon}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center',
                    status === 'done' && 'text-emerald-600',
                    status === 'active' && 'text-primary',
                    status === 'pending' && 'text-gray-400',
                    diversion.status === 'rejected' && step.key === 'pending' && 'text-red-600'
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{step.role}</span>
                </div>
                {idx < flowSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2',
                      getStepStatus(flowSteps[idx + 1].key) === 'done' ? 'bg-emerald-300' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
        {diversion.status === 'rejected' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 font-medium">该单已被审核驳回，需重新提交分流</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-warm-300 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">{diversion.examNo}</span>
              <StatusBadge status={diversion.status} type="diversion" />
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <span>姓名：{diversion.patientName}</span>
              <span>年龄：{diversion.patientAge}</span>
              <span>性别：{diversion.patientGender}</span>
              <span>创建时间：{new Date(diversion.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            {diversion.assignedDept && (
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <span>指派科室：{diversion.assignedDept}</span>
                <span>指派医生：{diversion.assignedDoctor}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {diversion.anomalyType.map((type) => {
                const badge = anomalyBadgeMap[type]
                if (!badge) return null
                return (
                  <span key={type} className={cn('inline-flex items-center px-2.5 py-1 rounded text-xs font-medium', badge.className)}>
                    {badge.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {(showDivertBtn || showConfirmBtn || showCompleteBtn || showReviewBtn) && (
        <div className="bg-white rounded-lg border border-warm-300 p-4 flex items-center gap-3">
          {showDivertBtn && (
            <button
              onClick={() => setShowModal(true)}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              提交分流
            </button>
          )}
          {showConfirmBtn && (
            <button
              onClick={() => handleAction('confirm')}
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              确认接收
            </button>
          )}
          {showCompleteBtn && (
            <button
              onClick={() => handleAction('complete')}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              标记完成
            </button>
          )}
          {showReviewBtn && (
            <>
              <button
                onClick={() => handleAction('approve')}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> 审核通过
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> 审核不通过
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-warm-300 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">操作记录</h3>
          <Timeline logs={logs} />
        </div>

        <div className="bg-white rounded-lg border border-warm-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">附件</h3>
            <button
              onClick={() => handleUpload()}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-light font-medium"
            >
              <Upload className="w-3.5 h-3.5" /> 新增附件
            </button>
          </div>
          {attachments.length === 0 ? (
            <div className="border-2 border-dashed border-warm-300 rounded-lg p-8 text-center text-gray-400 text-sm">
              暂无附件，点击上传添加
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 p-2.5 rounded border border-warm-200 hover:bg-warm-50">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-700 truncate">{att.fileName}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{att.fileType}</span>
                    </div>
                    {att.uploadedAt ? (
                      <span className="text-[10px] text-gray-400">
                        {att.uploadedBy} 上传于 {new Date(att.uploadedAt).toLocaleString('zh-CN')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">待上传</span>
                    )}
                  </div>
                  {!att.fileUrl ? (
                    <button
                      onClick={() => handleUpload(att.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary-light font-medium px-2 py-1 rounded border border-primary/30 hover:bg-primary/5"
                    >
                      <Upload className="w-3 h-3" /> 上传
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">已上传</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">提交分流</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标科室</label>
                <select
                  value={modalDept}
                  onChange={(e) => { setModalDept(e.target.value); setModalDoctor('') }}
                  className="w-full px-3 py-2 rounded border border-warm-300 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">请选择科室</option>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标医生</label>
                <select
                  value={modalDoctor}
                  onChange={(e) => setModalDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-warm-300 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">请选择医生（可选）</option>
                  {(doctors[modalDept] || []).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-warm-300 text-sm text-gray-600 hover:bg-warm-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitDiversion}
                disabled={!modalDept || submitting}
                className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">审核不通过</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">不通过原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入不通过原因"
                rows={3}
                className="w-full px-3 py-2 rounded border border-warm-300 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded border border-warm-300 text-sm text-gray-600 hover:bg-warm-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason || submitting}
                className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
