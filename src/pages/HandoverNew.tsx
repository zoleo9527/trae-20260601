import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, ClipboardCheck, AlertTriangle, X } from 'lucide-react'
import dayjs from 'dayjs'
import { useHandoverStore } from '@/stores/handoverStore'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/stores/authStore'

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

  const [pendingVisitsCount, setPendingVisitsCount] = useState<number | null>(null)
  const [activeRecallsCount, setActiveRecallsCount] = useState<number | null>(null)

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
    if (!toUserId) {
      setPendingVisitsCount(null)
      setActiveRecallsCount(null)
      return
    }
    fetch('/api/visits?status=pending')
      .then((res) => res.json())
      .then((data) => {
        const list = data.data ?? data
        setPendingVisitsCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => setPendingVisitsCount(null))

    fetch('/api/recalls?status=active')
      .then((res) => res.json())
      .then((data) => {
        const list = data.data ?? data
        setActiveRecallsCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => setActiveRecallsCount(null))
  }, [toUserId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!toUserId) {
      setError('请选择交班对象')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createHandover({
        to_user_id: toUserId as number,
        handover_date: handoverDate,
        summary,
        key_notes: keyNotes,
        from_user_id: user!.id,
        status: 'pending',
      } as unknown as Record<string, unknown>)
      const res = await fetch('/api/handover')
      if (res.ok) {
        const data = await res.json()
        const list = data.data ?? data
        if (Array.isArray(list) && list.length > 0) {
          const latest = list[0] as { id: number }
          navigate(`/handovers/${latest.id}`)
          return
        }
      }
      navigate('/handovers')
    } catch {
      setError('创建交班记录失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ArrowRightLeft size={24} className="text-orange-600" />
        <h1 className="text-xl font-bold text-gray-800">创建交班</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
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
                {u.name} ({u.role})
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

        {toUserId && (pendingVisitsCount !== null || activeRecallsCount !== null) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">待交接事项预览</h3>
            <div className="space-y-1.5">
              {pendingVisitsCount !== null && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <ClipboardCheck size={16} />
                  <span>待处理回访: {pendingVisitsCount} 条</span>
                </div>
              )}
              {activeRecallsCount !== null && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle size={16} />
                  <span>进行中异常收回: {activeRecallsCount} 条</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

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
      </form>
    </div>
  )
}
