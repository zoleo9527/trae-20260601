import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, ClipboardCheck, AlertTriangle, X, FileText } from 'lucide-react'
import dayjs from 'dayjs'
import { useHandoverStore } from '@/stores/handoverStore'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/stores/authStore'

interface PreviewVisit {
  id: number
  animal_id: number
  animal_name: string
  status: string
  visit_date: string
  next_visit_date: string | null
  health_status: string | null
  visitor_name: string | null
}

interface PreviewRecall {
  id: number
  animal_id: number
  animal_name: string
  status: string
  reason: string
  report_date: string
  reporter_name: string | null
  handler_name: string | null
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

export default function HandoverNew() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const createHandover = useHandoverStore((s) => s.createHandover)

  const [users, setUsers] = useState<User[]>([])
  const [toUserId, setToUserId] = useState<number | ''>('')
  const [handoverDate, setHandoverDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [summary, setSummary] = useState('')
  const [keyNotes, setKeyNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [pendingVisits, setPendingVisits] = useState<PreviewVisit[]>([])
  const [activeRecalls, setActiveRecalls] = useState<PreviewRecall[]>([])
  const [previewLoaded, setPreviewLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        const list: User[] = data.data ?? data
        setUsers(list.filter((u) => u.id !== user?.id))
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    setPreviewLoaded(false)
    fetch(`/api/handover/preview?from_user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPendingVisits(data.pending_visits ?? [])
        setActiveRecalls(data.active_recalls ?? [])
        setPreviewLoaded(true)
      })
      .catch(() => {
        setPendingVisits([])
        setActiveRecalls([])
        setPreviewLoaded(true)
      })
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!toUserId) {
      setError('请选择交班对象')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const created = await createHandover({
        to_user_id: toUserId as number,
        handover_date: handoverDate,
        summary,
        key_notes: keyNotes,
        from_user_id: user!.id,
        status: 'pending',
      } as unknown as Record<string, unknown>)
      if (created?.id) {
        navigate(`/handovers/${created.id}`)
      } else {
        navigate('/handovers')
      }
    } catch {
      setError('创建交班记录失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ArrowRightLeft size={24} className="text-orange-600" />
        <h1 className="text-xl font-bold text-gray-800">创建交班</h1>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="col-span-3 space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                交班对象 <span className="text-red-500">*</span>
              </label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                required
              >
                <option value="">请选择交班对象</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({({ volunteer: '志愿者', vet: '兽医', adoption_officer: '领养审核员', admin: '管理员' } as Record<string, string>)[u.role] ?? u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">交班日期</label>
              <input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">交班摘要</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                placeholder="请输入交班摘要..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">重点事项</label>
              <textarea
                value={keyNotes}
                onChange={(e) => setKeyNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                placeholder="请输入需要重点关注的事项..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/handovers')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={16} />
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowRightLeft size={16} />
                {submitting ? '提交中...' : '提交交班'}
              </button>
            </div>
          </div>
        </form>

        <div className="col-span-2 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <ClipboardCheck size={16} />
              待处理回访
              <span className="text-xs font-normal text-amber-600">({pendingVisits.length} 条)</span>
            </h3>
            {previewLoaded && pendingVisits.length > 0 ? (
              <div className="space-y-2">
                {pendingVisits.map((v) => {
                  const cfg = VISIT_STATUS[v.status] ?? { label: v.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={v.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <FileText size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-800 font-medium truncate">{v.animal_name || `动物#${v.animal_id}`}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 pl-5">
                          回访 #{v.id}
                          {v.next_visit_date && ` · 下次 ${dayjs(v.next_visit_date).format('MM-DD')}`}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : previewLoaded ? (
              <p className="text-sm text-amber-600">无待处理回访</p>
            ) : (
              <p className="text-sm text-amber-400">加载中...</p>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              进行中异常收回
              <span className="text-xs font-normal text-red-600">({activeRecalls.length} 条)</span>
            </h3>
            {previewLoaded && activeRecalls.length > 0 ? (
              <div className="space-y-2">
                {activeRecalls.map((r) => {
                  const cfg = RECALL_STATUS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={r.id} className="flex items-start justify-between px-3 py-2 bg-white rounded-lg text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                          <span className="text-gray-800 font-medium truncate">{r.animal_name || `动物#${r.animal_id}`}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 pl-5 line-clamp-2">
                          收回 #{r.id} · {r.reason}
                        </div>
                        {r.handler_name && (
                          <div className="text-xs text-gray-400 mt-0.5 pl-5">
                            处理人: {r.handler_name}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : previewLoaded ? (
              <p className="text-sm text-red-600">无进行中异常收回</p>
            ) : (
              <p className="text-sm text-red-400">加载中...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
