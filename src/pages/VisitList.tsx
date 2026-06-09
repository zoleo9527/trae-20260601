import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Filter, CheckSquare, Square } from 'lucide-react'
import dayjs from 'dayjs'
import { useVisitStore } from '@/stores/visitStore'
import { useAnimalStore } from '@/stores/animalStore'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'completed', label: '已完成' },
  { value: 'need_followup', label: '需跟进' },
  { value: 'transferred_to_recall', label: '转异常收回' },
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
  need_followup: { label: '需跟进', cls: 'bg-orange-100 text-orange-700' },
  transferred_to_recall: { label: '转异常收回', cls: 'bg-red-100 text-red-700' },
}

export default function VisitList() {
  const navigate = useNavigate()
  const { visits, loading, fetchVisits, batchUpdate } = useVisitStore()
  const { animals, fetchAnimals } = useAnimalStore()

  const [statusFilter, setStatusFilter] = useState('')
  const [animalFilter, setAnimalFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  useEffect(() => {
    fetchAnimals({ limit: 100 })
  }, [fetchAnimals])

  const loadList = useCallback(() => {
    const params: Record<string, unknown> = {}
    if (statusFilter) params.status = statusFilter
    if (animalFilter) params.animal_id = Number(animalFilter)
    fetchVisits(params)
  }, [statusFilter, animalFilter, fetchVisits])

  useEffect(() => {
    loadList()
  }, [loadList])

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === visits.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visits.map((v) => v.id)))
    }
  }

  async function handleBatchComplete() {
    if (selected.size === 0) return
    setBatchLoading(true)
    try {
      await batchUpdate(Array.from(selected), { status: 'completed' })
      setSelected(new Set())
      loadList()
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">回访记录</h1>
        <button
          onClick={() => navigate('/visits/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          新建回访
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={animalFilter}
            onChange={(e) => setAnimalFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            <option value="">全部动物</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-orange-700">已选择 {selected.size} 条记录</span>
          <button
            onClick={handleBatchComplete}
            disabled={batchLoading}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {batchLoading ? '处理中...' : '批量标记已完成'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-10 px-3 py-3 text-center">
                <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                  {selected.size === visits.length && visits.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">动物名称</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">回访日期</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">回访人</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">健康状态</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">行为状态</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">环境状态</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && visits.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  加载中...
                </td>
              </tr>
            )}
            {!loading && visits.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  暂无回访记录
                </td>
              </tr>
            )}
            {visits.map((v) => {
              const badge = STATUS_BADGE[v.status] ?? { label: v.status, cls: 'bg-gray-100 text-gray-600' }
              return (
                <tr
                  key={v.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/visits/${v.id}`)}
                >
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(v.id)} className="text-gray-400 hover:text-gray-600">
                      {selected.has(v.id) ? <CheckSquare size={16} className="text-orange-600" /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-800">{String(v.animal_name ?? v.animal_id)}</td>
                  <td className="px-3 py-3 text-gray-600">{v.visit_date ? dayjs(v.visit_date).format('YYYY-MM-DD') : '-'}</td>
                  <td className="px-3 py-3 text-gray-600">{String(v.visitor_name ?? '-')}</td>
                  <td className="px-3 py-3 text-gray-600">{String(v.health_status ?? '-')}</td>
                  <td className="px-3 py-3 text-gray-600">{String(v.behavior_status ?? '-')}</td>
                  <td className="px-3 py-3 text-gray-600">{String(v.environment_status ?? '-')}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/visits/${v.id}`)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      处理
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
