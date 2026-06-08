import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { useAppState } from '@/context/AppContext'
import { SeverityBadge, StatusBadge, CategoryBadge } from '@/components/Badges'
import EmptyState from '@/components/EmptyState'
import NewDamageModal from '@/components/NewDamageModal'
import type { DamageStatus, DamageCategory, DamageSeverity } from '@/types'

const statusFilters: (DamageStatus | '全部')[] = ['全部', '待处理', '处理中', '待认定', '已认定', '已关闭']
const categoryFilters: (DamageCategory | '全部')[] = ['全部', '包装破损', '货物湿损', '货物丢失', '货物变形', '标签脱落', '温控异常']
const severityFilters: (DamageSeverity | '全部')[] = ['全部', '轻微', '一般', '严重', '特重大']

export default function DamageList() {
  const navigate = useNavigate()
  const { state, dispatch } = useAppState()
  const damageRecords = state.damageRecords
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DamageStatus | '全部'>('全部')
  const [categoryFilter, setCategoryFilter] = useState<DamageCategory | '全部'>('全部')
  const [severityFilter, setSeverityFilter] = useState<DamageSeverity | '全部'>('全部')
  const [showFilters, setShowFilters] = useState(false)
  const [newDamageModalOpen, setNewDamageModalOpen] = useState(false)

  const filtered = damageRecords.filter(r => {
    if (statusFilter !== '全部' && r.status !== statusFilter) return false
    if (categoryFilter !== '全部' && r.category !== categoryFilter) return false
    if (severityFilter !== '全部' && r.severity !== severityFilter) return false
    if (search && !r.awb.includes(search) && !r.flightNo.includes(search) && !r.description.includes(search)) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-surface-900">异常货损</h1>
          <p className="text-sm text-surface-500 mt-1">查看和处理所有异常货损记录，确保货损与责任认定之间信息可追溯</p>
        </div>
        <button className="btn-primary" onClick={() => setNewDamageModalOpen(true)}>
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      <div className="card">
        <div className="px-5 py-3 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="搜索运单号、航班号或描述..."
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
                <div className="text-xs font-medium text-surface-500 mb-1.5">状态</div>
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
                <div className="text-xs font-medium text-surface-500 mb-1.5">类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {categoryFilters.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                        categoryFilter === c ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-surface-500 mb-1.5">严重程度</div>
                <div className="flex flex-wrap gap-1.5">
                  {severityFilters.map(s => (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                        severityFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="暂无匹配的货损记录"
            description="尝试调整筛选条件或搜索关键词"
          />
        ) : (
          <div className="divide-y divide-surface-100">
            {filtered.map(record => (
              <div
                key={record.id}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-50/60 transition-colors cursor-pointer"
                onClick={() => navigate(`/damage/${record.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-surface-400">{record.id}</span>
                    <span className="text-sm font-mono font-semibold text-surface-800">{record.awb}</span>
                    <span className="text-xs text-surface-400">{record.flightNo} · {record.route}</span>
                  </div>
                  <p className="text-sm text-surface-600 leading-relaxed mb-2 line-clamp-2">{record.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={record.category} />
                    <SeverityBadge severity={record.severity} />
                    <StatusBadge status={record.status} />
                    {record.evidenceChain.length > 0 && (
                      <span className="text-xs text-surface-400">{record.evidenceChain.length} 条证据</span>
                    )}
                    {record.abnormalNote && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                        异常说明
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                    <span>发现时间：{record.discoveryTime}</span>
                    <span>发现地点：{record.discoveryLocation}</span>
                    {record.handler && <span>处理人：{record.handler}</span>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <NewDamageModal
        open={newDamageModalOpen}
        onClose={() => setNewDamageModalOpen(false)}
        onSubmit={data => {
          dispatch({ type: 'ADD_DAMAGE', payload: data })
        }}
      />
    </div>
  )
}
