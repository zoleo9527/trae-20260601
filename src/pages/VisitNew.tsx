import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useVisitStore } from '@/stores/visitStore'
import { useAnimalStore } from '@/stores/animalStore'
import { useAuthStore } from '@/stores/authStore'

const HEALTH_OPTIONS = [
  { value: '良好', label: '良好' },
  { value: '一般', label: '一般' },
  { value: '较差', label: '较差' },
]

const BEHAVIOR_OPTIONS = [
  { value: '正常', label: '正常' },
  { value: '异常', label: '异常' },
  { value: '异常-攻击性', label: '异常-攻击性' },
]

const ENVIRONMENT_OPTIONS = [
  { value: '良好', label: '良好' },
  { value: '一般', label: '一般' },
  { value: '差-空间不足', label: '差-空间不足' },
  { value: '差-卫生问题', label: '差-卫生问题' },
]

export default function VisitNew() {
  const navigate = useNavigate()
  const { createVisit } = useVisitStore()
  const { animals, fetchAnimals } = useAnimalStore()
  const user = useAuthStore((s) => s.user)

  const [animalId, setAnimalId] = useState('')
  const [adoptionId, setAdoptionId] = useState('')
  const [visitDate, setVisitDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [healthStatus, setHealthStatus] = useState('')
  const [behaviorStatus, setBehaviorStatus] = useState('')
  const [environmentStatus, setEnvironmentStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [adoptionList, setAdoptionList] = useState<{ id: number; adopter_name: string }[]>([])

  useEffect(() => {
    fetchAnimals({ limit: 100 })
  }, [fetchAnimals])

  useEffect(() => {
    if (!animalId) {
      setAdoptionList([])
      setAdoptionId('')
      return
    }
    fetch(`/api/animals/${animalId}`)
      .then((r) => r.json())
      .then((data) => {
        const animal = data.data ?? data
        if (animal.adoptions && Array.isArray(animal.adoptions)) {
          setAdoptionList(animal.adoptions)
        } else {
          setAdoptionList([])
        }
      })
      .catch(() => setAdoptionList([]))
  }, [animalId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!animalId || !visitDate) return
    setSubmitting(true)
    try {
      await createVisit({
        animal_id: Number(animalId),
        adoption_id: adoptionId ? Number(adoptionId) : undefined,
        visit_date: visitDate,
        visitor_id: user?.id,
        visitor_role: user?.role,
        health_status: healthStatus || undefined,
        behavior_status: behaviorStatus || undefined,
        environment_status: environmentStatus || undefined,
        notes: notes || undefined,
        next_visit_date: nextVisitDate || undefined,
        status: 'pending',
      })
      navigate('/visits')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">新建回访</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className={labelCls}>动物 <span className="text-red-500">*</span></label>
          <select value={animalId} onChange={(e) => setAnimalId(e.target.value)} required className={inputCls}>
            <option value="">请选择动物</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.species})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>关联领养记录</label>
          <select value={adoptionId} onChange={(e) => setAdoptionId(e.target.value)} className={inputCls} disabled={!animalId}>
            <option value="">无</option>
            {adoptionList.map((a) => (
              <option key={a.id} value={a.id}>{a.adopter_name} (#{a.id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>回访日期 <span className="text-red-500">*</span></label>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>回访人</label>
          <input type="text" value={user?.name ?? ''} disabled className={`${inputCls} bg-gray-50 text-gray-500`} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>健康状态</label>
            <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} className={inputCls}>
              <option value="">请选择</option>
              {HEALTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>行为状态</label>
            <select value={behaviorStatus} onChange={(e) => setBehaviorStatus(e.target.value)} className={inputCls}>
              <option value="">请选择</option>
              {BEHAVIOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>环境状态</label>
            <select value={environmentStatus} onChange={(e) => setEnvironmentStatus(e.target.value)} className={inputCls}>
              <option value="">请选择</option>
              {ENVIRONMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>备注</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="请输入回访备注" />
        </div>

        <div>
          <label className={labelCls}>下次回访日期</label>
          <input type="date" value={nextVisitDate} onChange={(e) => setNextVisitDate(e.target.value)} className={inputCls} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/visits')}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  )
}
