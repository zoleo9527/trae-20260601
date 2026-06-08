import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { damageRecords, liabilityRecords } from '@/data/mock'
import { SeverityBadge, StatusBadge, CategoryBadge, LiabilityStatusBadge } from '@/components/Badges'
import EmptyState from '@/components/EmptyState'

type RecordType = 'all' | 'damage' | 'liability'

interface UnifiedRecord {
  id: string
  type: 'damage' | 'liability'
  awb: string
  flightNo: string
  category: string
  severity: string
  status: string
  summary: string
  timestamp: string
  hasAbnormalNote: boolean
  linkedId?: string
}

const unifiedRecords: UnifiedRecord[] = [
  ...damageRecords.map(d => ({
    id: d.id,
    type: 'damage' as const,
    awb: d.awb,
    flightNo: d.flightNo,
    category: d.category,
    severity: d.severity,
    status: d.status,
    summary: d.description,
    timestamp: d.updatedAt,
    hasAbnormalNote: !!d.abnormalNote,
    linkedId: d.liabilityId,
  })),
  ...liabilityRecords
    .filter(l => !damageRecords.some(d => d.liabilityId === l.id))
    .map(l => ({
      id: l.id,
      type: 'liability' as const,
      awb: l.awb,
      flightNo: l.flightNo,
      category: l.category,
      severity: l.severity,
      status: l.status,
      summary: l.responsibleDetail || l.basis || '待认定',
      timestamp: l.updatedAt,
      hasAbnormalNote: !!l.abnormalNote,
      linkedId: l.damageId,
    })),
].sort((a, b) => b.timestamp.localeCompare(a.timestamp))

export default function History() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<RecordType>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = unifiedRecords.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (search && !r.awb.includes(search) && !r.flightNo.includes(search) && !r.summary.includes(search)) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">历史记录</h1>
        <p className="text-sm text-surface-500 mt-1">统一追溯异常货损和责任认定的完整记录，一线处理和管理回看基于同一份数据</p>
      </div>

      <div className="card">
        <div className="px-5 py-3 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="搜索运单号、航班号或关键词..."
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
            <div className="mt-3 pt-3 border-t border-surface-100">
              <div className="text-xs font-medium text-surface-500 mb-1.5">记录类型</div>
              <div className="flex flex-wrap gap-1.5">
                {([['all', '全部'], ['damage', '异常货损'], ['liability', '责任认定']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className={clsx(
                      'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                      typeFilter === key ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="暂无历史记录" description="调整筛选条件查看更多记录" />
        ) : (
          <div className="divide-y divide-surface-100">
            {filtered.map(record => (
              <div
                key={record.id}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-50/60 transition-colors cursor-pointer"
                onClick={() => navigate(record.type === 'damage' ? `/damage/${record.id}` : `/liability/${record.id}`)}
              >
                <div className={clsx(
                  'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
                  record.type === 'damage' ? 'bg-amber-400' : 'bg-indigo-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold',
                      record.type === 'damage' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    )}>
                      {record.type === 'damage' ? '货损' : '认定'}
                    </span>
                    <span className="text-sm font-mono font-semibold text-surface-800">{record.awb}</span>
                    <span className="text-xs text-surface-400">{record.flightNo}</span>
                    <CategoryBadge category={record.category as any} />
                    <SeverityBadge severity={record.severity as any} />
                    {record.type === 'damage' ? (
                      <StatusBadge status={record.status as any} />
                    ) : (
                      <LiabilityStatusBadge status={record.status} />
                    )}
                    {record.hasAbnormalNote && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                        异常说明
                      </span>
                    )}
                    {record.linkedId && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[11px] font-medium">
                        已关联
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-600 leading-relaxed line-clamp-2">{record.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                    <span>更新：{record.timestamp}</span>
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
