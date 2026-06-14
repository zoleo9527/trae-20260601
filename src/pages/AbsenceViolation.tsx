import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { AVType, AVStatus, ViolationCategory, AbsenceViolationRecord, AuditLog } from '../../shared/types'

const STATUS_MAP: Record<AVStatus, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-amber-100 text-amber-700' },
  resubmitted: { label: '重提待审', cls: 'bg-orange-100 text-orange-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
  supplemented: { label: '已补录', cls: 'bg-blue-100 text-blue-700' },
}

const VIOLATION_MAP: Record<ViolationCategory, string> = {
  cheat: '作弊',
  impersonate: '替考',
  disrupt: '扰乱考场',
  device: '携带设备',
  other: '其他',
}

const TYPE_MAP: Record<AVType, string> = {
  absence: '缺考',
  violation: '违纪',
}

const ROLE_NAME: Record<string, string> = {
  invigilator: '监考老师',
  admin: '考务专员',
  tech: '技术支持',
}

type TabType = 'absence' | 'violation'

function StatusBadge({ status }: { status: AVStatus }) {
  const s = STATUS_MAP[status]
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
      >
        <option value="">{placeholder || '请选择'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

interface SubmitFormData {
  candidateId: string
  type: AVType
  violationType: ViolationCategory | ''
  roomId: string
  subjectId: string
  remark: string
  parentId?: string
}

const emptySubmitForm: SubmitFormData = {
  candidateId: '',
  type: 'absence',
  violationType: '',
  roomId: '',
  subjectId: '',
  remark: '',
}

function SubmitModal({
  open,
  onClose,
  onSubmit,
  rooms,
  subjects,
  candidates,
  defaultType,
  initialData,
  title,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: SubmitFormData) => void
  rooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  candidates: { id: string; name: string; ticketNo: string }[]
  defaultType: AVType
  initialData?: SubmitFormData
  title?: string
}) {
  const [form, setForm] = useState<SubmitFormData>({ ...emptySubmitForm, type: defaultType })

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({ ...initialData })
      } else {
        setForm({ ...emptySubmitForm, type: defaultType })
      }
    }
  }, [open, defaultType, initialData])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (key: keyof SubmitFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title || '提交缺考/违纪记录'}</h3>
        {form.parentId && (
          <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-700">
            ⚠️ 本记录为「驳回后重新提交」，将关联原记录 ID：<span className="font-mono font-medium">{form.parentId}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            label="考生"
            value={form.candidateId}
            onChange={(v) => update('candidateId', v)}
            options={candidates.map((c) => ({ value: c.id, label: `${c.name} (${c.ticketNo})` }))}
            placeholder="请选择考生"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              类型<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-6">
              {(['absence', 'violation'] as AVType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="avType"
                    checked={form.type === t}
                    onChange={() => update('type', t)}
                    className="accent-amber-600"
                  />
                  <span className="text-sm">{TYPE_MAP[t]}</span>
                </label>
              ))}
            </div>
          </div>
          {form.type === 'violation' && (
            <SelectField
              label="违纪类型"
              value={form.violationType}
              onChange={(v) => update('violationType', v)}
              options={(Object.entries(VIOLATION_MAP) as [ViolationCategory, string][]).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              placeholder="请选择违纪类型"
              required
            />
          )}
          <SelectField
            label="考场"
            value={form.roomId}
            onChange={(v) => update('roomId', v)}
            options={rooms.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="请选择考场"
            required
          />
          <SelectField
            label="科目"
            value={form.subjectId}
            onChange={(v) => update('subjectId', v)}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="请选择科目"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              情况说明<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={form.remark}
              onChange={(e) => update('remark', e.target.value)}
              rows={3}
              placeholder="请描述具体情况，不得为空"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors">
              {form.parentId ? '重新提交' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ReviewFormData {
  action: 'approved' | 'rejected' | 'supplemented'
  opinion: string
  supplement: {
    candidateId: string
    type: AVType
    violationType: ViolationCategory | ''
    roomId: string
    subjectId: string
    remark: string
  }
}

function ReviewModal({
  open,
  onClose,
  onSubmit,
  record,
  rooms,
  subjects,
  candidates,
  initialAction,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: ReviewFormData) => void
  record: AbsenceViolationRecord | null
  rooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  candidates: { id: string; name: string; ticketNo: string }[]
  initialAction?: ReviewFormData['action']
}) {
  const [form, setForm] = useState<ReviewFormData>({
    action: 'approved',
    opinion: '',
    supplement: { candidateId: '', type: 'absence', violationType: '', roomId: '', subjectId: '', remark: '' },
  })

  useEffect(() => {
    if (record) {
      setForm({
        action: initialAction || (record.status === 'rejected' ? 'supplemented' : 'approved'),
        opinion: '',
        supplement: {
          candidateId: record.candidateId,
          type: record.type,
          violationType: record.violationType || '',
          roomId: record.roomId,
          subjectId: record.subjectId,
          remark: record.remark,
        },
      })
    }
  }, [record, initialAction])

  if (!open || !record) return null

  const candidate = candidates.find((c) => c.id === record.candidateId)
  const room = rooms.find((r) => r.id === record.roomId)
  const subject = subjects.find((s) => s.id === record.subjectId)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">审核记录</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={record.status} />
            <span className="text-xs text-gray-400">版本 v{record.version}</span>
            {record.parentId && <span className="text-xs text-orange-600">关联父记录 {record.parentId}</span>}
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">考生姓名:</span>
            <span className="font-medium">{candidate?.name || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">准考证号:</span>
            <span className="font-medium">{candidate?.ticketNo || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">类型:</span>
            <span className="font-medium">{TYPE_MAP[record.type]}</span>
          </div>
          {record.violationType && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-20 shrink-0">违纪类型:</span>
              <span className="font-medium">{VIOLATION_MAP[record.violationType]}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">考场:</span>
            <span className="font-medium">{room?.name || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">科目:</span>
            <span className="font-medium">{subject?.name || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">提交人:</span>
            <span className="font-medium">{record.submittedBy}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20 shrink-0">备注:</span>
            <span className="font-medium break-all">{record.remark || '-'}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            label="审核操作"
            value={form.action}
            onChange={(v) => setForm((prev) => ({ ...prev, action: v as ReviewFormData['action'] }))}
            options={[
              { value: 'approved', label: '✅ 通过（记录无误，归档）' },
              { value: 'rejected', label: '❌ 驳回（退回监考老师重提）' },
              { value: 'supplemented', label: '➕ 补录（新增关联记录）' },
            ]}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              审核意见<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={form.opinion}
              onChange={(e) => setForm((prev) => ({ ...prev, opinion: e.target.value }))}
              rows={3}
              placeholder="请填写审核意见，系统将留痕"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              required
            />
          </div>
          {form.action === 'supplemented' && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-blue-700 bg-blue-50 p-2 rounded">
                ➕ 补录说明：将新增一条关联到本记录的缺考/违纪记录，用于遗漏登记的补充场景
              </p>
              <SelectField
                label="补录-考生"
                value={form.supplement.candidateId}
                onChange={(v) => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, candidateId: v } }))}
                options={candidates.map((c) => ({ value: c.id, label: `${c.name} (${c.ticketNo})` }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex gap-6">
                  {(['absence', 'violation'] as AVType[]).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="suppType"
                        checked={form.supplement.type === t}
                        onChange={() => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, type: t } }))}
                        className="accent-amber-600"
                      />
                      <span className="text-sm">{TYPE_MAP[t]}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.supplement.type === 'violation' && (
                <SelectField
                  label="违纪类型"
                  value={form.supplement.violationType}
                  onChange={(v) => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, violationType: v as ViolationCategory } }))}
                  options={(Object.entries(VIOLATION_MAP) as [ViolationCategory, string][]).map(([k, v]) => ({
                    value: k,
                    label: v,
                  }))}
                  required
                />
              )}
              <SelectField
                label="考场"
                value={form.supplement.roomId}
                onChange={(v) => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, roomId: v } }))}
                options={rooms.map((r) => ({ value: r.id, label: r.name }))}
                required
              />
              <SelectField
                label="科目"
                value={form.supplement.subjectId}
                onChange={(v) => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, subjectId: v } }))}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">补录说明</label>
                <textarea
                  value={form.supplement.remark}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplement: { ...prev.supplement, remark: e.target.value } }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors">
              提交审核
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AVDetailModal({
  open,
  onClose,
  recordId,
  rooms,
  subjects,
  candidates,
}: {
  open: boolean
  onClose: () => void
  recordId: string | null
  rooms: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  candidates: { id: string; name: string; ticketNo: string }[]
}) {
  const { fetchAVDetail } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<{ record: AbsenceViolationRecord & { candidateName?: string; ticketNo?: string; roomName?: string; subjectName?: string }; auditLogs: AuditLog[] } | null>(null)

  useEffect(() => {
    if (open && recordId) {
      setLoading(true)
      fetchAVDetail(recordId)
        .then((res) => setDetail(res as any))
        .finally(() => setLoading(false))
    } else {
      setDetail(null)
    }
  }, [open, recordId, fetchAVDetail])

  if (!open) return null

  const r = detail?.record
  const candidate = r ? candidates.find((c) => c.id === r.candidateId) : null
  const room = r ? rooms.find((rm) => rm.id === r.roomId) : null
  const subject = r ? subjects.find((s) => s.id === r.subjectId) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">记录详情 & 流程时间线</h3>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
        ) : !r ? (
          <div className="text-center py-12 text-gray-400 text-sm">记录不存在</div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <StatusBadge status={r.status} />
                <span className="text-xs text-gray-400">ID: {r.id}</span>
                <span className="text-xs text-gray-400">版本 v{r.version}</span>
                {r.parentId && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">驳回重提 · 父 {r.parentId}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">考生:</span>
                  <span className="font-medium">{r.candidateName || candidate?.name || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">准考证:</span>
                  <span className="font-medium font-mono text-xs">{r.ticketNo || candidate?.ticketNo || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">类型:</span>
                  <span className="font-medium">{TYPE_MAP[r.type]}</span>
                </div>
                {r.violationType && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">违纪类型:</span>
                    <span className="font-medium">{VIOLATION_MAP[r.violationType]}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">考场:</span>
                  <span className="font-medium">{r.roomName || room?.name || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">科目:</span>
                  <span className="font-medium">{r.subjectName || subject?.name || '-'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">提交人:</span>
                  <span className="font-medium">{r.submittedBy}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">审核人:</span>
                  <span className="font-medium">{r.reviewedBy || '-'}</span>
                </div>
                <div className="col-span-2 flex gap-2">
                  <span className="text-gray-500 w-20 shrink-0">情况说明:</span>
                  <span className="font-medium break-all">{r.remark || '-'}</span>
                </div>
                {r.opinion && (
                  <div className="col-span-2 flex gap-2">
                    <span className="text-gray-500 w-20 shrink-0">审核意见:</span>
                    <span className="font-medium break-all">{r.opinion}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">🚦 流程时间线（系统留痕）</h4>
              {!detail?.auditLogs?.length ? (
                <div className="text-center text-gray-400 py-6 text-sm">暂无操作记录</div>
              ) : (
                <div className="space-y-0 border-l-2 border-gray-200 ml-2">
                  {detail.auditLogs.map((log, idx) => (
                    <div key={log.id} className="relative pl-6 pb-5 last:pb-0">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                        log.action === 'submit' || log.action === 'resubmit' ? 'bg-amber-500' :
                        log.action === 'approve' ? 'bg-green-500' :
                        log.action === 'reject' ? 'bg-red-500' :
                        log.action === 'supplement' || log.action === 'supplement-create' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{log.operatorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {ROLE_NAME[log.operatorRole] || log.operatorRole}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          {log.action === 'submit' ? '提交' :
                           log.action === 'resubmit' ? '重新提交' :
                           log.action === 'approve' ? '审核通过' :
                           log.action === 'reject' ? '审核驳回' :
                           log.action === 'supplement' ? '补录完成' :
                           log.action === 'supplement-create' ? '补录新增' :
                           log.action}
                        </span>
                        {log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100">{STATUS_MAP[log.fromStatus as AVStatus]?.label || log.fromStatus}</span>
                            <span>→</span>
                            <span className="px-1.5 py-0.5 rounded bg-gray-100">{STATUS_MAP[log.toStatus as AVStatus]?.label || log.toStatus}</span>
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

        <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
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

export default function AbsenceViolation() {
  const { avRecords, role, fetchAVRecords, submitAVRecord, reviewAVRecord, rooms, subjects, candidates, fetchRooms } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlStatus = searchParams.get('status') || ''
  const urlHighlight = searchParams.get('highlight') || ''

  const [tab, setTab] = useState<TabType>('absence')
  const [filterRoom, setFilterRoom] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStatus, setFilterStatus] = useState(urlStatus)
  const [highlightId, setHighlightId] = useState<string | null>(urlHighlight || null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitInitialData, setSubmitInitialData] = useState<SubmitFormData | undefined>()
  const [submitTitle, setSubmitTitle] = useState<string | undefined>()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewingRecord, setReviewingRecord] = useState<AbsenceViolationRecord | null>(null)
  const [reviewInitialAction, setReviewInitialAction] = useState<ReviewFormData['action'] | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const loadRecords = () => {
    const filters: Record<string, string> = { type: tab }
    if (filterRoom) filters.roomId = filterRoom
    if (filterSubject) filters.subjectId = filterSubject
    if (filterStatus) filters.status = filterStatus
    fetchAVRecords(filters)
  }

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    loadRecords()
  }, [tab, filterStatus])

  useEffect(() => {
    if (highlightId && tableRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`av-row-${highlightId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('bg-amber-100')
          setTimeout(() => {
            el.classList.remove('bg-amber-100')
            setHighlightId(null)
            setSearchParams({}, { replace: true })
          }, 3000)
        }
      }, 300)
    }
  }, [highlightId, avRecords, setSearchParams])

  const handleQuery = () => {
    loadRecords()
  }

  const handleSubmit = async (data: SubmitFormData) => {
    await submitAVRecord({
      candidateId: data.candidateId,
      type: data.type,
      violationType: data.violationType || undefined,
      roomId: data.roomId,
      subjectId: data.subjectId,
      remark: data.remark,
      ...(data.parentId ? { parentId: data.parentId } : {}),
    })
    setSubmitOpen(false)
    setSubmitInitialData(undefined)
    setSubmitTitle(undefined)
    loadRecords()
  }

  const handleReview = async (data: ReviewFormData) => {
    if (!reviewingRecord) return
    const actionMap = { approved: 'approve', rejected: 'reject', supplemented: 'supplement' } as const
    await reviewAVRecord(reviewingRecord.id, {
      action: actionMap[data.action],
      opinion: data.opinion,
      ...(data.action === 'supplemented' ? { supplementData: data.supplement } : {}),
    })
    setReviewOpen(false)
    setReviewingRecord(null)
    setReviewInitialAction(undefined)
    loadRecords()
  }

  const openReview = (record: AbsenceViolationRecord, presetAction?: ReviewFormData['action']) => {
    setReviewingRecord(record)
    setReviewInitialAction(presetAction)
    setReviewOpen(true)
  }

  const openResubmit = (record: AbsenceViolationRecord) => {
    setSubmitInitialData({
      candidateId: record.candidateId,
      type: record.type,
      violationType: record.violationType || '',
      roomId: record.roomId,
      subjectId: record.subjectId,
      remark: record.remark,
      parentId: record.id,
    })
    setSubmitTitle('重新提交缺考/违纪记录（驳回后修改）')
    setSubmitOpen(true)
  }

  const openDetail = (id: string) => {
    setDetailRecordId(id)
    setDetailOpen(true)
  }

  const filteredRecords = avRecords.filter((r) => {
    if (filterRoom && r.roomId !== filterRoom) return false
    if (filterSubject && r.subjectId !== filterSubject) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const getCandidateName = (id: string) => candidates.find((c) => c.id === id)?.name || id
  const getCandidateTicket = (id: string) => candidates.find((c) => c.id === id)?.ticketNo || '-'
  const getRoomName = (id: string) => rooms.find((r) => r.id === id)?.name || id
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id

  const statusOptions = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'resubmitted', label: '重提待审' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'supplemented', label: '已补录' },
  ]

  const roomOptions = [{ value: '', label: '全部考场' }, ...rooms.map((r) => ({ value: r.id, label: r.name }))]
  const subjectOptions = [{ value: '', label: '全部科目' }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-0 border-b border-gray-200">
          {(['absence', 'violation'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium relative transition-colors ${
                tab === t ? 'text-amber-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'absence' ? '缺考记录' : '违纪记录'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
            </button>
          ))}
        </div>
        {role === 'invigilator' && (
          <button
            onClick={() => {
              setSubmitInitialData(undefined)
              setSubmitTitle(undefined)
              setSubmitOpen(true)
            }}
            className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors"
          >
            + 提交缺考/违纪
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <SelectField label="考场" value={filterRoom} onChange={setFilterRoom} options={roomOptions} placeholder="全部考场" />
          <SelectField label="科目" value={filterSubject} onChange={setFilterSubject} options={subjectOptions} placeholder="全部科目" />
          <SelectField label="状态" value={filterStatus} onChange={setFilterStatus} options={statusOptions} placeholder="全部状态" />
          <button
            onClick={handleQuery}
            className="px-5 py-2 rounded-lg bg-[#d97706] text-white text-sm font-medium hover:bg-[#b45309] transition-colors"
          >
            🔍 查询
          </button>
        </div>
      </div>

      <div ref={tableRef} className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left">
                <th className="px-4 py-3 font-medium">考生姓名</th>
                <th className="px-4 py-3 font-medium">准考证号</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">违纪类型</th>
                <th className="px-4 py-3 font-medium">考场</th>
                <th className="px-4 py-3 font-medium">科目</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">版本/关联</th>
                <th className="px-4 py-3 font-medium">提交人</th>
                <th className="px-4 py-3 font-medium">审核人</th>
                <th className="px-4 py-3 font-medium">审核意见</th>
                <th className="px-4 py-3 font-medium w-48">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-400">暂无记录</td>
                </tr>
              )}
              {filteredRecords.map((r) => (
                <tr
                  key={r.id}
                  id={`av-row-${r.id}`}
                  className={`hover:bg-gray-50 transition-colors duration-500 ${
                    highlightId === r.id ? 'bg-amber-100' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{getCandidateName(r.candidateId)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{getCandidateTicket(r.candidateId)}</td>
                  <td className="px-4 py-3">{TYPE_MAP[r.type]}</td>
                  <td className="px-4 py-3">{r.violationType ? VIOLATION_MAP[r.violationType] : '-'}</td>
                  <td className="px-4 py-3">{getRoomName(r.roomId)}</td>
                  <td className="px-4 py-3">{getSubjectName(r.subjectId)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      <div className="text-gray-500">v{r.version}</div>
                      {r.parentId && <div className="text-orange-600">重提自 {r.parentId}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.submittedBy}</td>
                  <td className="px-4 py-3 text-gray-600">{r.reviewedBy || '-'}</td>
                  <td className="px-4 py-3 max-w-[140px]">
                    <span className="truncate block" title={r.opinion || ''}>{r.opinion || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      role={role}
                      record={r}
                      onReview={(rec, action) => openReview(rec, action)}
                      onResubmit={openResubmit}
                      onDetail={openDetail}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SubmitModal
        open={submitOpen}
        onClose={() => { setSubmitOpen(false); setSubmitInitialData(undefined); setSubmitTitle(undefined) }}
        onSubmit={handleSubmit}
        rooms={rooms}
        subjects={subjects}
        candidates={candidates}
        defaultType={tab}
        initialData={submitInitialData}
        title={submitTitle}
      />

      <ReviewModal
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewingRecord(null); setReviewInitialAction(undefined) }}
        onSubmit={handleReview}
        record={reviewingRecord}
        rooms={rooms}
        subjects={subjects}
        candidates={candidates}
        initialAction={reviewInitialAction}
      />

      <AVDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecordId(null) }}
        recordId={detailRecordId}
        rooms={rooms}
        subjects={subjects}
        candidates={candidates}
      />
    </div>
  )
}

function ActionButtons({
  role,
  record,
  onReview,
  onResubmit,
  onDetail,
}: {
  role: string | null
  record: AbsenceViolationRecord
  onReview: (r: AbsenceViolationRecord, preset?: ReviewFormData['action']) => void
  onResubmit: (r: AbsenceViolationRecord) => void
  onDetail: (id: string) => void
}) {
  const btns: JSX.Element[] = []

  btns.push(
    <button
      key="detail"
      onClick={() => onDetail(record.id)}
      className="px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
    >
      详情
    </button>
  )

  if (role === 'admin') {
    if (record.status === 'pending' || record.status === 'resubmitted') {
      btns.push(
        <button
          key="approve"
          onClick={() => onReview(record, 'approved')}
          className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          通过
        </button>
      )
      btns.push(
        <button
          key="reject"
          onClick={() => onReview(record, 'rejected')}
          className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
        >
          驳回
        </button>
      )
      btns.push(
        <button
          key="supplement"
          onClick={() => onReview(record, 'supplemented')}
          className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          补录
        </button>
      )
    } else if (record.status === 'rejected') {
      btns.push(
        <button
          key="supplement"
          onClick={() => onReview(record, 'supplemented')}
          className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          补录
        </button>
      )
    }
  }

  if (role === 'invigilator' && record.status === 'rejected') {
    btns.push(
      <button
        key="resubmit"
        onClick={() => onResubmit(record)}
        className="px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
      >
        重新提交
      </button>
    )
  }

  return <div className="flex flex-wrap gap-1">{btns.length ? btns : <span className="text-gray-400 text-xs">-</span>}</div>
}
