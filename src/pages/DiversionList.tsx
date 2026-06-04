import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileX, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Role } from '@/stores/appStore'
import StatusBadge from '@/components/StatusBadge'

type DiversionStatus = 'pending' | 'diverted' | 'confirmed' | 'completed' | 'rejected'

const statusTabs: { value: DiversionStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待分流' },
  { value: 'diverted', label: '已分流' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已打回' },
]

const anomalyBadgeMap: Record<string, { label: string; className: string }> = {
  missing_material: { label: '缺材料', className: 'bg-red-50 text-red-600' },
  timeout: { label: '超时', className: 'bg-amber-50 text-amber-600' },
  review_failed: { label: '复核不通过', className: 'bg-red-50 text-red-600' },
}

const urgencyMap: Record<string, { label: string; className: string }> = {
  timeout: { label: '已超时', className: 'text-red-600 bg-red-50' },
  urgent: { label: '紧急', className: 'text-amber-600 bg-amber-50' },
  normal: { label: '普通', className: 'text-gray-500 bg-gray-50' },
}

interface Diversion {
  id: string
  examNo: string
  patientName: string
  patientAge: number
  patientGender: string
  anomalyType: string[]
  urgency: string
  status: DiversionStatus
}

export default function DiversionList() {
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [diversions, setDiversions] = useState<Diversion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<DiversionStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.set('status', activeTab)
    if (search) params.set('keyword', search)
    setLoading(true)
    fetch(`/api/diversions?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setDiversions(json.data ?? json ?? []))
      .catch(() => setDiversions([]))
      .finally(() => setLoading(false))
  }, [activeTab, search])

  const getActionLabel = (status: DiversionStatus): string | null => {
    if (currentRole === 'front_desk' && status === 'pending') return '分流'
    if (currentRole === 'doctor' && status === 'diverted') return '接收'
    if (currentRole === 'doctor' && status === 'confirmed') return '完成'
    if (currentRole === 'reviewer' && status === 'completed') return '审核'
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">导检分流</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-white rounded-lg border border-warm-300 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-warm-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索体检编号或姓名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm-300 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : diversions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="bg-white rounded-lg border border-warm-300 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50 border-b border-warm-300">
                <th className="text-left px-4 py-3 font-medium text-gray-600">体检编号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">年龄</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">性别</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">异常类型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">紧急程度</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {diversions.map((d) => {
                const actionLabel = getActionLabel(d.status)
                return (
                  <tr key={d.id} className="border-b border-warm-200 last:border-0 hover:bg-warm-50">
                    <td className="px-4 py-3 font-medium text-primary">{d.examNo}</td>
                    <td className="px-4 py-3 text-gray-700">{d.patientName}</td>
                    <td className="px-4 py-3 text-gray-600">{d.patientAge}</td>
                    <td className="px-4 py-3 text-gray-600">{d.patientGender}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.anomalyType.map((type) => {
                          const badge = anomalyBadgeMap[type]
                          if (!badge) return null
                          return (
                            <span key={type} className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium', badge.className)}>
                              {badge.label}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {urgencyMap[d.urgency] && (
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium', urgencyMap[d.urgency].className)}>
                          {urgencyMap[d.urgency].label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} type="diversion" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/diversion/${d.id}`)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          查看
                        </button>
                        {actionLabel && (
                          <button
                            onClick={() => navigate(`/diversion/${d.id}`)}
                            className="text-xs bg-primary text-white px-2.5 py-1 rounded hover:bg-primary-light transition-colors"
                          >
                            {actionLabel}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
