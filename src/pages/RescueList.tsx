import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { useAnimalStore } from '@/stores/animalStore'
import { useAuthStore } from '@/stores/authStore'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'rescued', label: '已救助' },
  { value: 'fostered', label: '寄养中' },
  { value: 'adopted', label: '已领养' },
  { value: 'recalled', label: '已收回' },
]

const SPECIES_OPTIONS = [
  { value: '', label: '全部物种' },
  { value: '狗', label: '狗' },
  { value: '猫', label: '猫' },
]

const STATUS_LABELS: Record<string, string> = {
  rescued: '已救助',
  fostered: '寄养中',
  adopted: '已领养',
  recalled: '已收回',
}

const STATUS_COLORS: Record<string, string> = {
  rescued: 'bg-blue-100 text-blue-700',
  fostered: 'bg-purple-100 text-purple-700',
  adopted: 'bg-green-100 text-green-700',
  recalled: 'bg-red-100 text-red-700',
}

const GENDER_LABELS: Record<string, string> = {
  male: '公',
  female: '母',
  unknown: '未知',
}

export default function RescueList() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const animals = useAnimalStore((s) => s.animals)
  const pagination = useAnimalStore((s) => s.pagination)
  const loading = useAnimalStore((s) => s.loading)
  const fetchAnimals = useAnimalStore((s) => s.fetchAnimals)

  const [status, setStatus] = useState('')
  const [species, setSpecies] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchAnimals({
      status: status || undefined,
      species: species || undefined,
      search: search || undefined,
      page,
      limit: 10,
    })
  }, [status, species, search, page, fetchAnimals])

  const totalPages = Math.max(1, Math.ceil(pagination.total / (pagination.limit || 10)))
  const canCreate = user?.role === 'volunteer' || user?.role === 'admin'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">救助档案</h1>
        {canCreate && (
          <button
            onClick={() => navigate('/rescues/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            新建档案
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={species}
            onChange={(e) => { setSpecies(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            {SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索动物名称..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left font-medium text-gray-600">动物名称</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">物种</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">品种</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">年龄</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">性别</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">救助日期</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">加载中...</td>
              </tr>
            ) : animals.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">暂无数据</td>
              </tr>
            ) : (
              animals.map((animal) => (
                <tr
                  key={animal.id}
                  onClick={() => navigate(`/rescues/${animal.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{animal.name}</td>
                  <td className="px-6 py-4 text-gray-600">{animal.species}</td>
                  <td className="px-6 py-4 text-gray-600">{animal.breed || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{animal.age != null ? `${animal.age}岁` : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{GENDER_LABELS[animal.gender as string] || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {animal.rescue_date ? dayjs(animal.rescue_date).format('YYYY-MM-DD') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[animal.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[animal.status] || animal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/rescues/${animal.id}`) }}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 {pagination.total} 条记录，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
              上一页
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-orange-600">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
