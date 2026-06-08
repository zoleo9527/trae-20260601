import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowRight, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { liabilityRecords } from '@/data/mock'
import { SeverityBadge, CategoryBadge, LiabilityStatusBadge } from '@/components/Badges'
import EmptyState from '@/components/EmptyState'
import type { LiabilityParty } from '@/types'

const statusFilters = ['全部', '待认定', '认定中', '已认定', '已退回'] as const
const partyFilters: (LiabilityParty | '全部')[] = ['全部', '发货方', '承运方', '货站方', '收货方', '第三方', '待定']

export default function LiabilityList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [partyFilter, setPartyFilter] = useState<LiabilityParty | '全部'>('全部')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = liabilityRecords.filter(r => {
    if (statusFilter !== '全部' && r.status !== statusFilter) return false
    if (partyFilter !== '全部' && r.responsibleParty !== partyFilter) return false
    if (search && !r.awb.includes(search) && !r.flightNo.includes(search) && !r.responsibleDetail.includes(search)) return false
    return true
  })

  const returnedCount = liabilityRecords.filter(r => r.status === '已退回').length

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">责任认定</h1>
        <p className="text-sm text-surface-500 mt-1">基于同一份证据链进行责任认定，确保一线处理和管理回看可追溯</p>
      </div>

      {returnedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
          <RotateCcw className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="text-sm text-orange-800">
            <span className="font-semibold">{returnedCount}</span> 条认定记录被退回，请尽快重新认定
          </span>
          <button
            className="ml-auto text-sm text-orange-700 font-medium hover:underline"
            onClick={() => setStatusFilter('已退回')}
          >
            查看退回记录 →
          </button>
        </div>
      )}

      <div className="card">
        <div className="px-5 py-3 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="搜索运单号、航班号..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className={clsx('btn-ghost', showFilters && 'bg-surface-100')}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-surface-100 space-y-3">
              <div>
                <div className="text-xs font-medium text-surface-500 mb-1.5">认定状态</div>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilters.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                        statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-surface-500 mb-1.5">责任方</div>
                <div className="flex flex-wrap gap-1.5">
                  {partyFilters.map(p => (
                    <button
                      key={p}
                      onClick={() => setPartyFilter(p)}
                      className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                        partyFilter === p ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="暂无匹配的责任认定记录" description="尝试调整筛选条件" />
        ) : (
          <div className="divide-y divide-surface-100">
            {filtered.map(record => (
              <div
                key={record.id}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-50/60 transition-colors cursor-pointer"
                onClick={() => navigate(`/liability/${record.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-surface-400">{record.id}</span>
                    <span className="text-sm font-mono font-semibold text-surface-800">{record.awb}</span>
                    <span className="text-xs text-surface-400">{record.flightNo}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={record.category} />
                    <SeverityBadge severity={record.severity} />
                    <LiabilityStatusBadge status={record.status} />
                    {record.responsibleParty !== '待定' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                        责任方：{record.responsibleParty}
                      </span>
                    )}
                  </div>
                  {record.status === '已退回' && record.returnReason && (
                    <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2 mb-2">
                      <div className="text-xs font-semibold text-orange-800 mb-0.5">退回原因</div>
                      <p className="text-xs text-orange-700 leading-relaxed">{record.returnReason}</p>
                    </div>
                  )}
                  {record.responsibleDetail && (
                    <p className="text-sm text-surface-600 leading-relaxed line-clamp-2">{record.responsibleDetail}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                    <span>创建：{record.createdAt}</span>
                    <span>更新：{record.updatedAt}</span>
                    {record.determiner && <span>认定人：{record.determiner}</span>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
