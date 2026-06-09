import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { abnormalTypeLabels, processResultLabels, type BatchIssue } from '@/store'

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processed', label: '已处理' },
] as const

const abnormalTypeColors: Record<string, string> = {
  batch_error: 'bg-red-100 text-red-700',
  near_expiry: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  qual_expired: 'bg-orange-100 text-orange-700',
}

export default function BatchIssueList() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState<BatchIssue[]>([])
  const [tab, setTab] = useState<'all' | 'pending' | 'processed'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('processStatus', tab)
    fetch(`/api/batch-issues?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setIssues(data.data?.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab])

  const filtered = issues.filter((issue) => {
    if (!search) return true
    return (
      issue.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      issue.consumableName.toLowerCase().includes(search.toLowerCase()) ||
      issue.batchNo.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">批号异常工单</h2>

      <div className="flex items-center gap-4">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索单号、耗材名称或批号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无异常工单</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <button
              key={issue.id}
              onClick={() => navigate(`/batch-issues/${issue.id}`)}
              className="w-full text-left rounded-xl bg-white shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-indigo-700">{issue.orderNo}</span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        abnormalTypeColors[issue.abnormalType] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {abnormalTypeLabels[issue.abnormalType] || issue.abnormalType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {issue.consumableName} · 批号 {issue.batchNo}
                  </p>
                  {issue.abnormalNote && (
                    <p className="text-xs text-gray-500">{issue.abnormalNote}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {issue.processStatus === 'pending' ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-0.5 text-xs font-medium">
                      待处理
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-0.5 text-xs font-medium">
                      已处理
                    </span>
                  )}
                  {issue.processResult && (
                    <p className="text-xs text-gray-400 mt-1">{processResultLabels[issue.processResult] || issue.processResult}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
