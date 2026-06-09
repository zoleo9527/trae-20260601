import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  FileText,
  Paperclip,
  Upload,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useHandoverStore } from '@/stores/handoverStore'
import { useAuthStore } from '@/stores/authStore'

interface HandoverVisit {
  id: number
  animal_id: number
  animal_name?: string
  status: string
  visit_date?: string
  next_visit_date?: string | null
  health_status?: string | null
  visitor_name?: string | null
}

interface HandoverRecall {
  id: number
  animal_id: number
  animal_name?: string
  status: string
  reason?: string
  report_date?: string
  reporter_name?: string | null
  handler_name?: string | null
}

interface HandoverAttachment {
  id: number
  file_name: string
  file_path: string
  file_size?: number
  uploaded_at?: string
}

interface HandoverDetail {
  id: number
  status: string
  from_user_id: number
  to_user_id: number
  from_user_name?: string
  to_user_name?: string
  handover_date?: string
  summary?: string
  key_notes?: string
  pending_visits_count?: number
  active_recalls_count?: number
  pending_visits?: HandoverVisit[]
  active_recalls?: HandoverRecall[]
  attachments?: HandoverAttachment[]
  confirmed_at?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', className: 'bg-green-100 text-green-700' },
}

const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-amber-100 text-amber-700' },
  need_followup: { label: '需跟进', cls: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
  transferred_to_recall: { label: '已转异常收回', cls: 'bg-red-100 text-red-700' },
}

const RECALL_STATUS: Record<string, { label: string; cls: string }> = {
  initiated: { label: '已发起', cls: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', cls: 'bg-purple-100 text-purple-700' },
  executing: { label: '执行收回', cls: 'bg-amber-100 text-amber-700' },
  recalled: { label: '已收回', cls: 'bg-red-100 text-red-700' },
  closed: { label: '已关闭', cls: 'bg-gray-100 text-gray-600' },
}

export default function HandoverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentHandover = useHandoverStore((s) => s.currentHandover)
  const loading = useHandoverStore((s) => s.loading)
  const fetchHandover = useHandoverStore((s) => s.fetchHandover)
  const confirmHandover = useHandoverStore((s) => s.confirmHandover)
  const user = useAuthStore((s) => s.user)

  const [confirming, setConfirming] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [editingKeyNotes, setEditingKeyNotes] = useState(false)
  const [summary, setSummary] = useState('')
  const [keyNotes, setKeyNotes] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) fetchHandover(Number(id))
  }, [id, fetchHandover])

  useEffect(() => {
    if (currentHandover) {
      setSummary((currentHandover as unknown as HandoverDetail).summary ?? '')
      setKeyNotes((currentHandover as unknown as HandoverDetail).key_notes ?? '')
    }
  }, [currentHandover])

  const h = currentHandover as unknown as HandoverDetail | null
  const isPending = h?.status === 'pending'
  const isToUser = user?.id === h?.to_user_id

  async function handleConfirm() {
    if (!id) return
    setConfirming(true)
    try {
      await confirmHandover(Number(id))
      await fetchHandover(Number(id))
    } catch {
    } finally {
      setConfirming(false)
    }
  }

  async function handleSaveSummary() {
    if (!h) return
    try {
      await fetch(`/api/handover/${h.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      setEditingSummary(false)
      await fetchHandover(h.id)
    } catch {
    }
  }

  async function handleSaveKeyNotes() {
    if (!h) return
    try {
      await fetch(`/api/handover/${h.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_notes: keyNotes }),
      })
      setEditingKeyNotes(false)
      await fetchHandover(h.id)
    } catch {
    }
  }

  async function refreshAttachments() {
    if (!id) return
    await fetchHandover(Number(id))
  }

  if (loading && !h) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        加载中...
      </div>
    )
  }

  if (!h) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <ArrowRightLeft size={40} className="mb-3 opacity-30" />
        <p>交班记录不存在</p>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[h.status] ?? {
    label: h.status,
    className: 'bg-gray-100 text-gray-700',
  }

  const attachments = h.attachments ?? []

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/handovers')}
            className="text-sm text-gray-500 hover:text-orange-600 transition-colors"
          >
            ← 返回列表
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-800">交班信息</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusCfg.className}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">交班人</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {h.from_user_name ?? `用户${h.from_user_id}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">接班人</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {h.to_user_name ?? `用户${h.to_user_id}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">交班日期</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {h.handover_date ? dayjs(h.handover_date).format('YYYY-MM-DD') : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">确认时间</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {h.confirmed_at ? dayjs(h.confirmed_at).format('YYYY-MM-DD HH:mm') : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">交班摘要</h3>
            {isPending && !editingSummary && (
              <button
                onClick={() => setEditingSummary(true)}
                className="text-xs text-orange-600 hover:underline"
              >
                编辑
              </button>
            )}
          </div>
          {editingSummary ? (
            <div className="space-y-2">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSummary}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditingSummary(false)
                    setSummary(h.summary ?? '')
                  }}
                  className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {h.summary || '暂无摘要'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">重点事项</h3>
            {isPending && !editingKeyNotes && (
              <button
                onClick={() => setEditingKeyNotes(true)}
                className="text-xs text-orange-600 hover:underline"
              >
                编辑
              </button>
            )}
          </div>
          {editingKeyNotes ? (
            <div className="space-y-2">
              <textarea
                value={keyNotes}
                onChange={(e) => setKeyNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveKeyNotes}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditingKeyNotes(false)
                    setKeyNotes(h.key_notes ?? '')
                  }}
                  className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          ) : h.key_notes ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 whitespace-pre-wrap">
              {h.key_notes}
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无重点事项</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-amber-500" />
            待处理回访
            {h.pending_visits_count != null && (
              <span className="text-xs text-gray-400">({h.pending_visits_count} 条)</span>
            )}
          </h3>
          {h.pending_visits && h.pending_visits.length > 0 ? (
            <div className="space-y-2">
              {h.pending_visits.map((v) => {
                const cfg = VISIT_STATUS[v.status] ?? { label: v.status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={v.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-700">
                        回访 #{v.id}
                        {v.animal_name && <span className="text-gray-400 ml-1">- {v.animal_name}</span>}
                      </span>
                      {v.next_visit_date && (
                        <span className="text-xs text-gray-400 ml-2">
                          下次 {dayjs(v.next_visit_date).format('MM-DD')}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">无待处理回访</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            进行中异常收回
            {h.active_recalls_count != null && (
              <span className="text-xs text-gray-400">({h.active_recalls_count} 条)</span>
            )}
          </h3>
          {h.active_recalls && h.active_recalls.length > 0 ? (
            <div className="space-y-2">
              {h.active_recalls.map((r) => {
                const cfg = RECALL_STATUS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={r.id} className="flex items-start justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-700">
                        收回 #{r.id}
                        {r.animal_name && <span className="text-gray-400 ml-1">- {r.animal_name}</span>}
                      </div>
                      {r.reason && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.reason}</div>
                      )}
                      {r.handler_name && (
                        <div className="text-xs text-gray-400 mt-0.5">处理人: {r.handler_name}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">无进行中异常收回</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Paperclip size={16} className="text-gray-500" />
            附件
          </h3>
          <div className="mb-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors cursor-pointer">
              <Upload size={14} />
              上传附件
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !id) return
                  setUploading(true)
                  try {
                    const form = new FormData()
                    form.append('file', file)
                    form.append('entity_type', 'handover')
                    form.append('entity_id', id)
                    const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
                    if (res.ok) await refreshAttachments()
                  } finally {
                    setUploading(false)
                    e.target.value = ''
                  }
                }}
              />
            </label>
            {uploading && <span className="ml-2 text-xs text-gray-400">上传中...</span>}
          </div>
          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <FileText size={14} className="text-gray-400 flex-shrink-0" />
                  <a
                    href={`/${a.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate hover:text-orange-600 transition-colors"
                    download
                  >
                    {a.file_name}
                  </a>
                  {a.file_size != null && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {(a.file_size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      await fetch(`/api/attachments/${a.id}`, { method: 'DELETE' })
                      await refreshAttachments()
                    }}
                    className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">无附件</p>
          )}
        </div>

        {isPending && isToUser && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {confirming ? '确认中...' : '确认接收'}
          </button>
        )}
      </div>

      <div className="w-[380px] flex-shrink-0">
        <div className="sticky top-0 bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">交班单</h2>
            <p className="text-xs text-gray-400 mt-1">
              {h.handover_date ? dayjs(h.handover_date).format('YYYY年MM月DD日') : ''}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">交班人</span>
              <span className="font-medium text-gray-800">
                {h.from_user_name ?? `用户${h.from_user_id}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">接班人</span>
              <span className="font-medium text-gray-800">
                {h.to_user_name ?? `用户${h.to_user_id}`}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {h.summary && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1">摘要</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.summary}</p>
            </div>
          )}

          {h.key_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-amber-700 mb-1">⚠ 重点事项</h4>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{h.key_notes}</p>
            </div>
          )}

          {h.pending_visits && h.pending_visits.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">待处理回访</h4>
              <ul className="space-y-1">
                {h.pending_visits.map((v) => {
                  const cfg = VISIT_STATUS[v.status] ?? { label: v.status, cls: '' }
                  return (
                    <li key={v.id} className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      回访 #{v.id}{v.animal_name ? ` - ${v.animal_name}` : ''}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {h.active_recalls && h.active_recalls.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">进行中异常收回</h4>
              <ul className="space-y-1">
                {h.active_recalls.map((r) => {
                  const cfg = RECALL_STATUS[r.status] ?? { label: r.status, cls: '' }
                  return (
                    <li key={r.id} className="text-sm text-gray-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      收回 #{r.id}{r.animal_name ? ` - ${r.animal_name}` : ''}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">附件</h4>
              <ul className="space-y-1">
                {attachments.map((a) => (
                  <li key={a.id} className="text-sm text-gray-700 flex items-center gap-1.5">
                    <FileText size={12} className="text-gray-400 flex-shrink-0" />
                    <a href={`/${a.file_path}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors" download>
                      {a.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {h.status === 'confirmed' && (
            <>
              <div className="border-t border-dashed border-gray-300" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">已确认接收</span>
                </div>
                {h.confirmed_at && (
                  <p className="text-xs text-gray-400">
                    {dayjs(h.confirmed_at).format('YYYY-MM-DD HH:mm')}
                  </p>
                )}
                <div className="mt-3 border-t border-gray-300 pt-3">
                  <p className="text-xs text-gray-400">签名</p>
                  <div className="mt-1 h-8 border-b border-gray-300" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
