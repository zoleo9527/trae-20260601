import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Eye,
  X,
  User,
  Heart,
  Activity,
  Home,
  StickyNote,
  ChevronRight,
  Upload,
  Paperclip,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useRecallStore } from '@/stores/recallStore'
import { useAuthStore } from '@/stores/authStore'

const STEPS = [
  { key: 'initiated', label: '已发起' },
  { key: 'reviewing', label: '审核中' },
  { key: 'executing', label: '执行收回' },
]

const TERMINAL_STEPS = [
  { key: 'recalled', label: '已收回' },
  { key: 'closed', label: '已关闭' },
]

const STATUS_LABELS: Record<string, string> = {
  initiated: '已发起',
  reviewing: '审核中',
  executing: '执行收回',
  recalled: '已收回',
  closed: '已关闭',
}

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status)
  if (idx >= 0) return idx
  if (status === 'recalled' || status === 'closed') return STEPS.length
  return 0
}

function Stepper({ status, resolvedDate }: { status: string; resolvedDate?: string | null }) {
  const currentIdx = getStepIndex(status)
  const isTerminal = status === 'recalled' || status === 'closed'

  const allSteps = [...STEPS]
  if (isTerminal) {
    allSteps.push({ key: status, label: STATUS_LABELS[status] })
  }

  return (
    <div className="flex items-center justify-center py-6">
      {allSteps.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : isCurrent ? <Circle size={14} /> : idx + 1}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isCompleted ? 'text-green-600' : isCurrent ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < allSteps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-1 ${
                  idx < currentIdx ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TimelineNode({
  icon,
  title,
  date,
  children,
  linkTo,
  highlight,
}: {
  icon: React.ReactNode
  title: string
  date?: string | null
  children?: React.ReactNode
  linkTo?: string
  highlight?: boolean
}) {
  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      <div
        className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          highlight ? 'bg-orange-500 border-orange-500 text-white' : 'bg-indigo-500 border-indigo-500 text-white'
        }`}
        style={{ fontSize: 10 }}
      >
        {icon}
      </div>
      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-gray-200" />
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-semibold ${highlight ? 'text-orange-700' : 'text-gray-800'}`}>
          {title}
        </span>
        {date && <span className="text-xs text-gray-400">{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>}
        {linkTo && (
          <Link
            to={linkTo}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-0.5"
          >
            查看详情 <ChevronRight size={12} />
          </Link>
        )}
      </div>
      {children && <div className="text-sm text-gray-600">{children}</div>}
    </div>
  )
}

function Modal({
  open,
  title,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmDisabled?: boolean
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>
        {children}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecallDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { currentRecall, loading, fetchRecall, updateRecall } = useRecallStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'recalled' | 'closed' | ''>('')
  const [resolution, setResolution] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [attachments, setAttachments] = useState<{ id: number; file_name: string; file_path: string; file_size?: number }[]>([])

  useEffect(() => {
    if (id) fetchRecall(Number(id))
  }, [id, fetchRecall])

  useEffect(() => {
    if (id) {
      fetch(`/api/attachments/recall/${id}`)
        .then((r) => r.json())
        .then((data) => setAttachments(Array.isArray(data) ? data : []))
        .catch(() => setAttachments([]))
    }
  }, [id])

  if (loading || !currentRecall) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        {loading ? '加载中...' : '收回记录不存在'}
      </div>
    )
  }

  const r = currentRecall as Record<string, unknown>
  const status = r.status as string
  const animalName = r.animal_name as string | undefined
  const reporterName = r.reporter_name as string | undefined
  const handlerName = r.handler_name as string | undefined
  const sourceVisit = r.source_visit as Record<string, unknown> | null
  const animal = r.animal as Record<string, unknown> | null
  const resolvedDate = r.resolved_date as string | null
  const reportDate = r.report_date as string
  const reason = r.reason as string
  const existingResolution = r.resolution as string | null

  const canReview = user?.role === 'adoption_officer' || user?.role === 'admin'

  async function handleTransition(newStatus: string) {
    if (!id) return
    setTransitioning(true)
    try {
      await updateRecall(Number(id), {
        status: newStatus,
        handler_id: user?.id,
        handler_role: user?.role,
        resolution: resolution || undefined,
      } as Record<string, unknown>)
      setModalOpen(false)
      setModalType('')
      setResolution('')
      fetchRecall(Number(id))
    } catch {
      alert('操作失败，请重试')
    } finally {
      setTransitioning(false)
    }
  }

  function openModal(type: 'recalled' | 'closed') {
    setModalType(type)
    setResolution('')
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/recalls')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          异常收回 #{id}
        </h1>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            status === 'initiated'
              ? 'bg-blue-100 text-blue-700'
              : status === 'reviewing'
              ? 'bg-purple-100 text-purple-700'
              : status === 'executing'
              ? 'bg-amber-100 text-amber-700'
              : status === 'recalled'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">状态流程</h2>
            <Stepper status={status} resolvedDate={resolvedDate} />

            <div className="flex flex-wrap gap-3 mt-2 pt-4 border-t border-gray-100">
              {status === 'initiated' && (
                <>
                  {canReview && (
                    <button
                      onClick={() => handleTransition('reviewing')}
                      disabled={transitioning}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      开始审核
                    </button>
                  )}
                  <button
                    onClick={() => openModal('closed')}
                    disabled={transitioning}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    关闭
                  </button>
                </>
              )}
              {status === 'reviewing' && (
                <>
                  {canReview && (
                    <button
                      onClick={() => handleTransition('executing')}
                      disabled={transitioning}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      通过审核
                    </button>
                  )}
                  <button
                    onClick={() => openModal('closed')}
                    disabled={transitioning}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    驳回关闭
                  </button>
                </>
              )}
              {status === 'executing' && (
                <>
                  <button
                    onClick={() => openModal('recalled')}
                    disabled={transitioning}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    确认收回
                  </button>
                  <button
                    onClick={() => openModal('closed')}
                    disabled={transitioning}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    关闭
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">收回回看</h2>
            <div className="relative">
              {sourceVisit && (
                <TimelineNode
                  icon={<Eye size={10} />}
                  title="来源回访"
                  date={sourceVisit.visit_date as string}
                  linkTo={`/visits/${sourceVisit.id}`}
                >
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>回访人：{(sourceVisit as Record<string, unknown>).visitor_name as string ?? '-'}</span>
                    </div>
                    {(sourceVisit.health_status || sourceVisit.behavior_status || sourceVisit.environment_status) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {sourceVisit.health_status && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                            <Heart size={10} /> {sourceVisit.health_status as string}
                          </span>
                        )}
                        {sourceVisit.behavior_status && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">
                            <Activity size={10} /> {sourceVisit.behavior_status as string}
                          </span>
                        )}
                        {sourceVisit.environment_status && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                            <Home size={10} /> {sourceVisit.environment_status as string}
                          </span>
                        )}
                      </div>
                    )}
                    {sourceVisit.notes && (
                      <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
                        <StickyNote size={12} className="mt-0.5 flex-shrink-0" />
                        <span>{sourceVisit.notes as string}</span>
                      </div>
                    )}
                  </div>
                </TimelineNode>
              )}

              <TimelineNode
                icon={<AlertTriangle size={10} />}
                title="发起收回"
                date={reportDate}
                highlight
              >
                <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={12} />
                    <span>发起人：{reporterName ?? '-'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <StickyNote size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                </div>
              </TimelineNode>

              {status !== 'initiated' && (
                <TimelineNode
                  icon={<ClipboardCheck size={10} />}
                  title="开始审核"
                  date={r.updated_at as string}
                >
                  <div className="text-xs text-gray-500">
                    审核人：{handlerName ?? '-'}
                  </div>
                </TimelineNode>
              )}

              {(status === 'executing' || status === 'recalled' || status === 'closed') && (
                <TimelineNode
                  icon={<CheckCircle2 size={10} />}
                  title="审核通过，执行收回"
                  date={r.updated_at as string}
                >
                  <div className="text-xs text-gray-500">
                    处理人：{handlerName ?? '-'}
                  </div>
                </TimelineNode>
              )}

              {(status === 'recalled' || status === 'closed') && existingResolution && (
                <TimelineNode
                  icon={<FileText size={10} />}
                  title={status === 'recalled' ? '收回结果' : '关闭原因'}
                  date={resolvedDate}
                  highlight
                >
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>处理人：{handlerName ?? '-'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <StickyNote size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{existingResolution}</span>
                    </div>
                  </div>
                </TimelineNode>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">收回详情</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400">动物名称</dt>
                <dd className="text-sm font-medium text-gray-800">{animalName ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">发起日期</dt>
                <dd className="text-sm text-gray-700">{dayjs(reportDate).format('YYYY-MM-DD')}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">发起人</dt>
                <dd className="text-sm text-gray-700">{reporterName ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">当前处理人</dt>
                <dd className="text-sm text-gray-700">{handlerName ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">状态</dt>
                <dd className="text-sm text-gray-700">{STATUS_LABELS[status] ?? status}</dd>
              </div>
              {existingResolution && (
                <div>
                  <dt className="text-xs text-gray-400">{status === 'closed' ? '关闭原因' : '收回结果'}</dt>
                  <dd className="text-sm text-gray-700">{existingResolution}</dd>
                </div>
              )}
            </dl>
          </div>

          {animal && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">动物信息</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-400">名称</dt>
                  <dd className="text-sm font-medium text-gray-800">{animal.name as string}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">物种 / 品种</dt>
                  <dd className="text-sm text-gray-700">{animal.species as string} - {animal.breed as string}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">救助日期</dt>
                  <dd className="text-sm text-gray-700">{dayjs(animal.rescue_date as string).format('YYYY-MM-DD')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">当前位置</dt>
                  <dd className="text-sm text-gray-700">{(animal as Record<string, unknown>).rescue_location as string ?? '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">状态</dt>
                  <dd className="text-sm text-gray-700">{animal.status as string}</dd>
                </div>
                {animal.description && (
                  <div>
                    <dt className="text-xs text-gray-400">描述</dt>
                    <dd className="text-sm text-gray-600">{animal.description as string}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Paperclip size={16} className="text-gray-500" />
              附件
            </h2>
            <div className="mb-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors cursor-pointer">
                <Upload size={14} />
                上传附件
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !id) return
                    const form = new FormData()
                    form.append('file', file)
                    form.append('entity_type', 'recall')
                    form.append('entity_id', id)
                    const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
                    if (res.ok) {
                      const list = await fetch(`/api/attachments/recall/${id}`).then((r) => r.json())
                      setAttachments(Array.isArray(list) ? list : [])
                    }
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <FileText size={14} className="text-gray-400" />
                    <span className="flex-1 truncate">{att.file_name}</span>
                    {att.file_size && <span className="text-xs text-gray-400">{(att.file_size / 1024).toFixed(1)} KB</span>}
                    <button
                      onClick={async () => {
                        if (!id) return
                        await fetch(`/api/attachments/${att.id}`, { method: 'DELETE' })
                        const list = await fetch(`/api/attachments/recall/${id}`).then((r) => r.json())
                        setAttachments(Array.isArray(list) ? list : [])
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">暂无附件</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={modalType === 'recalled' ? '确认收回 - 填写收回结果' : '关闭原因'}
        onClose={() => setModalOpen(false)}
        onConfirm={() => modalType && handleTransition(modalType)}
        confirmLabel={modalType === 'recalled' ? '确认收回' : '确认关闭'}
        confirmDisabled={!resolution.trim()}
      >
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
          placeholder={modalType === 'recalled' ? '请输入收回结果...' : '请输入关闭原因...'}
        />
      </Modal>
    </div>
  )
}
