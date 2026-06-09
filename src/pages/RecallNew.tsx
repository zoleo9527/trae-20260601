import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import dayjs from 'dayjs'
import { useRecallStore } from '@/stores/recallStore'
import { useAnimalStore } from '@/stores/animalStore'
import { useVisitStore } from '@/stores/visitStore'
import { useAuthStore } from '@/stores/authStore'

export default function RecallNew() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { createRecall } = useRecallStore()
  const { animals, fetchAnimals } = useAnimalStore()
  const { visits, fetchVisits } = useVisitStore()

  const [animalId, setAnimalId] = useState<number | ''>('')
  const [sourceVisitId, setSourceVisitId] = useState<number | ''>('')
  const [reason, setReason] = useState('')
  const [reportDate, setReportDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAnimals()
  }, [fetchAnimals])

  useEffect(() => {
    if (animalId) {
      fetchVisits({ animal_id: animalId as number })
      setSourceVisitId('')
    }
  }, [animalId, fetchVisits])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!animalId || !reason.trim()) return
    setSubmitting(true)
    try {
      await createRecall({
        animal_id: animalId as number,
        source_visit_id: sourceVisitId || undefined,
        reason: reason.trim(),
        report_date: reportDate,
        reporter_id: user?.id,
        reporter_role: user?.role,
      } as Record<string, unknown>)
      const { currentRecall } = useRecallStore.getState()
      if (currentRecall?.id) {
        navigate(`/recalls/${currentRecall.id}`)
      } else {
        navigate('/recalls')
      }
    } catch {
      alert('创建异常收回失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const animalVisits = visits.filter((v) => v.animal_id === animalId)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">发起异常收回</h1>
        <button
          onClick={() => navigate('/recalls')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            动物 <span className="text-red-500">*</span>
          </label>
          <select
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value ? Number(e.target.value) : '')}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            <option value="">请选择动物</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.species} - {a.breed})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            关联回访记录
          </label>
          <select
            value={sourceVisitId}
            onChange={(e) => setSourceVisitId(e.target.value ? Number(e.target.value) : '')}
            disabled={!animalId}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">无（可选）</option>
            {animalVisits.map((v) => (
              <option key={v.id} value={v.id}>
                回访 #{v.id} - {dayjs(v.visit_date).format('YYYY-MM-DD')}
                {v.status === 'transferred_to_recall' ? ' [已转收回]' : ''}
              </option>
            ))}
          </select>
          {sourceVisitId && (
            <p className="mt-1 text-xs text-amber-600">
              提交后，该回访记录状态将自动更新为"已转异常收回"
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            原因 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-y"
            placeholder="请描述异常收回的原因..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">发起日期</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">发起人</label>
          <input
            type="text"
            value={user?.name ?? ''}
            disabled
            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/recalls')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !animalId || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  )
}
