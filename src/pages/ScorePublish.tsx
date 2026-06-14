import { useEffect, useState, type FormEvent } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { SPStatus, ScorePublishRecord, AuditLog, Role } from '../../shared/types'

type FilterTab = 'all' | SPStatus

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'initiated', label: '待审批' },
  { key: 'approved', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'rejected', label: '已驳回' },
]

const STATUS_MAP: Record<SPStatus, { label: string; cls: string; desc: string }> = {
  initiated: { label: '待审批(考务)', cls: 'bg-amber-100 text-amber-700', desc: '等待考务专员审核成绩汇总数据' },
  approved: { label: '待确认(技术)', cls: 'bg-blue-100 text-blue-700', desc: '等待技术支持与系统核对后确认发布' },
  confirmed: { label: '已发布', cls: 'bg-green-100 text-green-700', desc: '成绩已同步至查询系统，考生可查询' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700', desc: '发布申请被驳回，需重新发起' },
}

const ROLE_NAME: Record<string, string> = {
  invigilator: '监考老师',
  admin: '考务专员',
  tech: '考务中心',
}

function StatusBadge({ status, showDesc }: { status: SPStatus; showDesc?: boolean }) {
  const s = STATUS_MAP[status]
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
        {s.label}
      </span>
      {showDesc && <span className="text-[11px] text-gray-500">{s.desc}</span>}
    </div>
  )
}

interface InitiateFormData {
  subjectId: string
  total: string
  pass: string
  fail: string
  max: string
  min: string
  avg: string
}

const emptyInitiateForm: InitiateFormData = {
  subjectId: '',
  total: '',
  pass: '',
  fail: '',
  max: '',
  min: '',
  avg: '',
}

function InitiateModal({
  open,
  onClose,
  onSubmit,
  subjects,
  blockers,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: InitiateFormData) => void
  subjects: { id: string; name: string }[]
  blockers?: string[]
}) {
  const [form, setForm] = useState<InitiateFormData>({ ...emptyInitiateForm })
  const [totalErr, setTotalErr] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...emptyInitiateForm })
      setTotalErr('')
    }
  }, [open])

  useEffect(() => {
    const t = Number(form.total), p = Number(form.pass), f = Number(form.fail)
    if (t > 0 && (p >= 0 || f >= 0) && p + f !== t) {
      setTotalErr(`人数不匹配：及格(${p}) + 不及格(${f}) ≠ 总数(${t})`)
    } else {
      setTotalErr('')
    }
  }, [form.total, form.pass, form.fail])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (key: keyof InitiateFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">发起成绩发布</h3>
        {blockers && blockers.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 space-y-1">
          <div className="font-medium">⚠️ 前置条件未满足：</div>
          {blockers.map((b, i) => <div key={i} className="text-xs">• {b}</div>)}
        </div>
        )}
        <p className="text-sm text-gray-500 mb-4">按科目分批发布，考务专员发起 → 考务复核 → 技术确认发布，共 4 步流程</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              科目<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={form.subjectId}
              onChange={(e) => update('subjectId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              required
            >
              <option value="">请选择科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">人数统计<span className="text-red-500 ml-0.5">*</span></p>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="总人数" value={form.total} onChange={(v) => update('total', v)} required />
              <NumberField label="及格人数" value={form.pass} onChange={(v) => update('pass', v)} required />
              <NumberField label="不及格人数" value={form.fail} onChange={(v) => update('fail', v)} required />
            </div>
            {totalErr && <p className="text-xs text-red-600 mt-1">{totalErr}</p>}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">分数统计<span className="text-red-500 ml-0.5">*</span></p>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="最高分" value={form.max} onChange={(v) => update('max', v)} required />
              <NumberField label="最低分" value={form.min} onChange={(v) => update('min', v)} required />
              <NumberField label="平均分" value={form.avg} onChange={(v) => update('avg', v)} step="0.1" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
            <button
              type="submit"
              disabled={!!totalErr || !!blockers?.length}
              className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交申请
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  step?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step || '1'}
        min="0"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        required={required}
      />
    </div>
  )
}

function RejectModal({
  open,
  onClose,
  onSubmit,
  record,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (opinion: string) => void
  record: ScorePublishRecord | null
}) {
  const [opinion, setOpinion] = useState('')

  useEffect(() => {
    if (open) setOpinion('')
  }, [open])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(opinion)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">驳回成绩发布</h3>
        {record && (
          <p className="text-sm text-gray-500 mb-4">
            科目：<span className="font-medium text-gray-700">{record.subjectId}</span>
            <span className="text-gray-400 mx-1">·</span>
            状态：<span className="text-amber-700">{STATUS_MAP[record.status as SPStatus]?.label}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              驳回理由<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              rows={4}
              placeholder="请详细说明驳回原因，系统将留痕并通知发起人"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
              确认驳回
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type FlowStep = {
  step: number
  label: string
  status: 'done' | 'current' | 'pending'
  operator?: string
  time?: string
  detail?: string
}

function DetailModal({
  open,
  onClose,
  recordId,
  subjects,
  loading,
  flowData,
}: {
  open: boolean
  onClose: () => void
  recordId: string | null
  subjects: { id: string; name: string }[]
  loading: boolean
  flowData: {
    record: ScorePublishRecord & { subjectName?: string } | null
    auditLogs: AuditLog[]
    flow: FlowStep[]
  } | null
}) {
  if (!open) return null

  const r = flowData?.record
  const subjectName = r ? (subjects.find((s) => s.id === r.subjectId)?.name || r.subjectName || r.subjectId) : '-'
  const flow = flowData?.flow || []
  const auditLogs = flowData?.auditLogs || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📋 发布回看 & 审批流程</h3>
          {r && <StatusBadge status={r.status} showDesc />}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : !r ? (
          <div className="text-center py-12 text-gray-400 text-sm">记录不存在</div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <span className="text-base font-bold text-gray-900">{subjectName}</span>
                <span className="text-xs text-gray-400">ID: {r.id}</span>
                <span className="text-xs text-gray-400">版本 v{r.version}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatItem label="总人数" value={r.summary.total} color="gray" />
                <StatItem label="及格" value={r.summary.pass} color="green" />
                <StatItem label="不及格" value={r.summary.fail} color="red" />
                <StatItem label="最高分" value={r.summary.max} color="gray" />
                <StatItem label="最低分" value={r.summary.min} color="gray" />
                <StatItem label="平均分" value={r.summary.avg} color="amber" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">发起人:</span>
                  <span className="font-medium">{r.initiatedBy}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">发起时间:</span>
                  <span className="font-medium">{r.createdAt?.replace('T', ' ').slice(0, 19)}</span>
                </div>
                {r.confirmedBy && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">确认人:</span>
                    <span className="font-medium">{r.confirmedBy}</span>
                  </div>
                )}
                {r.confirmedAt && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">确认时间:</span>
                    <span className="font-medium">{r.confirmedAt?.replace('T', ' ').slice(0, 19)}</span>
                  </div>
                )}
                {r.rejectedBy && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">驳回人:</span>
                    <span className="font-medium">{r.rejectedBy}</span>
                  </div>
                )}
                {r.rejectedAt && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">驳回时间:</span>
                    <span className="font-medium">{r.rejectedAt?.replace('T', ' ').slice(0, 19)}</span>
                  </div>
                )}
                {r.opinion && (
                  <div className="col-span-2 flex gap-2 pt-2">
                    <span className="text-gray-500 w-20 shrink-0">审核意见:</span>
                    <span className="font-medium break-all">{r.opinion}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">🔄 审批流程时间线</h4>
              {flow.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">暂无流程信息</div>
              ) : (
                <div className="space-y-0">
                  {flow.map((step, idx) => {
                    const isDone = step.status === 'done'
                    const isCurrent = step.status === 'current'
                    const isRejected = isDone && step.detail?.includes('驳回')
                    return (
                      <div key={step.step} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center shrink-0 w-10">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                              isRejected
                                ? 'bg-red-500 text-white border-red-500'
                                : isDone
                                ? 'bg-green-500 text-white border-green-500'
                                : isCurrent
                                ? 'bg-white text-amber-600 border-amber-500 ring-4 ring-amber-100 animate-pulse'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            {isRejected ? '✕' : isDone ? '✓' : step.step}
                          </div>
                          {idx < flow.length - 1 && (
                            <div
                              className={`w-0.5 flex-1 mt-1 ${
                                isDone && !flow[idx + 1]?.detail?.includes('驳回') ? 'bg-green-300' : 'bg-gray-200'
                              }`}
                              style={{ minHeight: 16 }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-semibold ${
                              isCurrent ? 'text-amber-700' : isDone ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </span>
                            {step.operator && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                {step.operator}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                                当前步骤
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                                已驳回
                              </span>
                            )}
                          </div>
                          {step.detail && (
                            <p className={`text-sm ${isCurrent || isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                              {step.detail}
                            </p>
                          )}
                          {step.time && (
                            <p className="text-xs text-gray-400 mt-1">
                              {step.time.replace('T', ' ').slice(0, 19)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 操作留痕</h4>
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">暂无操作记录</div>
              ) : (
                <div className="space-y-0 border-l-2 border-gray-200 ml-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-4 last:pb-0">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        log.action === 'initiate' ? 'bg-amber-500' :
                        log.action === 'approve' ? 'bg-green-500' :
                        log.action === 'reject' ? 'bg-red-500' :
                        log.action === 'confirm' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{log.operatorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {ROLE_NAME[log.operatorRole as Role] || log.operatorRole}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          {log.action === 'initiate' ? '发起申请' :
                           log.action === 'approve' ? '审批通过' :
                           log.action === 'reject' ? '驳回申请' :
                           log.action === 'confirm' ? '确认发布' :
                           log.action}
                        </span>
                        {log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100">
                              {STATUS_MAP[log.fromStatus as SPStatus]?.label || log.fromStatus}
                            </span>
                            <span>→</span>
                            <span className="px-1.5 py-0.5 rounded bg-gray-100">
                              {STATUS_MAP[log.toStatus as SPStatus]?.label || log.toStatus}
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{log.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">{log.createdAt.replace('T', ' ').slice(0, 19)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, color = 'gray' }: { label: string; value: number; color?: 'gray' | 'green' | 'red' | 'amber' | 'blue' }) {
  const colorMap = {
    gray: 'bg-gray-50 text-gray-600 text-gray-900',
    green: 'bg-green-50 text-green-600 text-green-700',
    red: 'bg-red-50 text-red-600 text-red-700',
    amber: 'bg-amber-50 text-amber-600 text-amber-700',
    blue: 'bg-blue-50 text-blue-600 text-blue-700',
  }
  const c = colorMap[color]
  const parts = c.split(' ')
  return (
    <div className={`rounded-lg p-2.5 text-center border border-gray-100 ${parts[0]}`}>
      <div className={`text-xs mb-0.5 ${parts[1]}`}>{label}</div>
      <div className={`text-sm font-semibold ${parts[2]}`}>{value}</div>
    </div>
  )
}

function RecordCard({
  record,
  subjects,
  role,
  onApprove,
  onReject,
  onConfirm,
  onDetail,
}: {
  record: ScorePublishRecord & { subjectName?: string }
  subjects: { id: string; name: string }[]
  role: string | null
  onApprove: (r: ScorePublishRecord) => void
  onReject: (r: ScorePublishRecord) => void
  onConfirm: (r: ScorePublishRecord) => void
  onDetail: (r: ScorePublishRecord) => void
}) {
  const subjectName = subjects.find((s) => s.id === record.subjectId)?.name || record.subjectName || record.subjectId
  const { summary, status } = record

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{subjectName}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'admin' && status === 'initiated' && (
            <button
              onClick={() => onApprove(record)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              ✅ 审批通过
            </button>
          )}
          {role === 'admin' && (status === 'initiated' || status === 'approved') && (
            <button
              onClick={() => onReject(record)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              ❌ 驳回
            </button>
          )}
          {role === 'tech' && status === 'approved' && (
            <button
              onClick={() => onConfirm(record)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              🚀 确认发布
            </button>
          )}
          <button
            onClick={() => onDetail(record)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            🔍 查看流程
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        <StatItem label="总人数" value={summary.total} />
        <StatItem label="及格" value={summary.pass} color="green" />
        <StatItem label="不及格" value={summary.fail} color="red" />
        <StatItem label="最高分" value={summary.max} />
        <StatItem label="最低分" value={summary.min} />
        <StatItem label="平均分" value={summary.avg} color="amber" />
      </div>

      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
        <span>发起人: <span className="font-medium text-gray-700">{record.initiatedBy}</span></span>
        <span>发起时间: <span className="font-medium text-gray-700">{record.createdAt?.replace('T', ' ').slice(0, 19)}</span></span>
        <span>版本: <span className="font-medium text-gray-700">v{record.version}</span></span>
        {record.confirmedBy && <span>确认人: <span className="font-medium text-green-700">{record.confirmedBy}</span></span>}
        {record.rejectedBy && <span>驳回人: <span className="font-medium text-red-700">{record.rejectedBy}</span></span>}
      </div>
    </div>
  )
}

export default function ScorePublish() {
  const {
    spRecords,
    role,
    fetchSPRecords,
    initiateSP,
    approveSP,
    rejectSP,
    confirmSP,
    fetchSPFlow,
    subjects,
    fetchRooms,
    stageProgress,
    fetchDashboard,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [initiateOpen, setInitiateOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectingRecord, setRejectingRecord] = useState<ScorePublishRecord | null>(null)
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null)
  const [detailFlow, setDetailFlow] = useState<{
    record: any; auditLogs: AuditLog[]; flow: FlowStep[] } | null>(null)
  const [flowLoading, setFlowLoading] = useState(false)

  useEffect(() => {
    fetchRooms()
    fetchDashboard()
  }, [fetchRooms, fetchDashboard])

  useEffect(() => {
    const filters: Record<string, string> = {}
    if (activeTab !== 'all') filters.status = activeTab
    fetchSPRecords(filters)
  }, [activeTab, fetchSPRecords])

  const filteredRecords = activeTab === 'all'
    ? spRecords
    : spRecords.filter((r) => r.status === activeTab)

  const avProgress = stageProgress.find((p) => p.stage === 'absence-violation')
  const spBlockers = avProgress?.canProceed ? [] : (avProgress?.blockers || ['缺考违纪环节未完成'])

  const handleInitiate = async (data: InitiateFormData) => {
    await initiateSP({
      subjectId: data.subjectId,
      summary: {
        total: Number(data.total),
        pass: Number(data.pass),
        fail: Number(data.fail),
        max: Number(data.max),
        min: Number(data.min),
        avg: Number(data.avg),
      },
    })
    setInitiateOpen(false)
  }

  const handleApprove = async (record: ScorePublishRecord) => {
    await approveSP(record.id, { opinion: '审批通过，成绩数据核对无误' })
  }

  const openReject = (record: ScorePublishRecord) => {
    setRejectingRecord(record)
    setRejectOpen(true)
  }

  const handleReject = async (opinion: string) => {
    if (!rejectingRecord) return
    await rejectSP(rejectingRecord.id, { opinion })
    setRejectOpen(false)
    setRejectingRecord(null)
  }

  const handleConfirm = async (record: ScorePublishRecord) => {
    await confirmSP(record.id, { opinion: '成绩数据与系统核对一致，确认发布' })
  }

  const openDetail = async (record: ScorePublishRecord) => {
    setDetailRecordId(record.id)
    setDetailOpen(true)
    setFlowLoading(true)
    try {
      const flow = await fetchSPFlow(record.id)
      setDetailFlow(flow)
    } catch {
      setDetailFlow(null)
    } finally {
      setFlowLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-0 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium relative transition-colors ${
                activeTab === tab.key ? 'text-amber-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
            </button>
          ))}
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setInitiateOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors"
          >
            + 发起成绩发布
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <div className="text-sm">暂无记录</div>
            {role === 'admin' && (
              <button
                onClick={() => setInitiateOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors"
              >
                发起首个成绩发布
              </button>
            )}
          </div>
        )}
        {filteredRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            subjects={subjects}
            role={role}
            onApprove={handleApprove}
            onReject={openReject}
            onConfirm={handleConfirm}
            onDetail={openDetail}
          />
        ))}
      </div>

      <InitiateModal
        open={initiateOpen}
        onClose={() => setInitiateOpen(false)}
        onSubmit={handleInitiate}
        subjects={subjects}
        blockers={role === 'admin' ? spBlockers : undefined}
      />

      <RejectModal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectingRecord(null) }}
        onSubmit={handleReject}
        record={rejectingRecord}
      />

      <DetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecordId(null); setDetailFlow(null) }}
        recordId={detailRecordId}
        subjects={subjects}
        loading={flowLoading}
        flowData={detailFlow}
      />
    </div>
  )
}
