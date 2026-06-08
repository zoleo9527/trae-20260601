import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, ArrowRight, Clock, AlertTriangle, RotateCcw, Scale, X } from 'lucide-react'
import clsx from 'clsx'
import { useAppState } from '@/context/AppContext'
import { SeverityBadge, StatusBadge, CategoryBadge, FlagBadge } from '@/components/Badges'
import EmptyState from '@/components/EmptyState'
import NewDamageModal from '@/components/NewDamageModal'
import type { DamageStatus, DamageCategory, DamageSeverity, TaskFlag } from '@/types'

const statusFilters: (DamageStatus | '全部')[] = ['全部', '待处理', '处理中', '待认定', '已认定', '已关闭']
const categoryFilters: (DamageCategory | '全部')[] = ['全部', '包装破损', '货物湿损', '货物丢失', '货物变形', '标签脱落', '温控异常']
const severityFilters: (DamageSeverity | '全部')[] = ['全部', '轻微', '一般', '严重', '特重大']
const flagFilters: (TaskFlag | '全部')[] = ['全部', 'today', 'overdue', 'returned']
const flagLabels: Record<TaskFlag | '全部', string> = { '全部': '全部', today: '今日待办', overdue: '已拖延', returned: '被退回' }

export default function DamageList() {
  const navigate = useNavigate()
  const { state, dispatch } = useAppState()
  const damageRecords = state.damageRecords
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DamageStatus | '全部'>('全部')
  const [categoryFilter, setCategoryFilter] = useState<DamageCategory | '全部'>('全部')
  const [severityFilter, setSeverityFilter] = useState<DamageSeverity | '全部'>('全部')
  const [flagFilter, setFlagFilter] = useState<TaskFlag | '全部'>('全部')
  const [showFilters, setShowFilters] = useState(false)
  const [newDamageModalOpen, setNewDamageModalOpen] = useState(false)

  const filtered = damageRecords.filter(r => {
    if (statusFilter !== '全部' && r.status !== statusFilter) return false
    if (categoryFilter !== '全部' && r.category !== categoryFilter) return false
    if (severityFilter !== '全部' && r.severity !== severityFilter) return false
    if (flagFilter !== '全部' && r.flag !== flagFilter) return false
    if (search && !r.awb.includes(search) && !r.flightNo.includes(search) && !r.description.includes(search)) return false
    return true
  })

  const stats = useMemo(() => ({
    today: filtered.filter(r => r.flag === 'today').length,
    overdue: filtered.filter(r => r.flag === 'overdue').length,
    returned: filtered.filter(r => r.flag === 'returned').length,
    pendingLiability: filtered.filter(r => r.status === '待认定').length,
  }), [filtered])

  const hasActiveFilters = statusFilter !== '全部' || categoryFilter !== '全部' || severityFilter !== '全部' || flagFilter !== '全部' || search !== ''

  function clearAllFilters() {
    setStatusFilter('全部')
    setCategoryFilter('全部')
    setSeverityFilter('全部')
    setFlagFilter('全部')
    setSearch('')
  }

  const statCards = [
    { key: 'today' as const, label: '今日待办', count: stats.today, icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50', activeBg: 'bg-blue-100 ring-2 ring-blue-300', filterValue: 'today' as TaskFlag },
    { key: 'overdue' as const, label: '已拖延', count: stats.overdue, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50', activeBg: 'bg-red-100 ring-2 ring-red-300', filterValue: 'overdue' as TaskFlag },
    { key: 'returned' as const, label: '被退回', count: stats.returned, icon: <RotateCcw className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50', activeBg: 'bg-orange-100 ring-2 ring-orange-300', filterValue: 'returned' as TaskFlag },
    { key: 'pendingLiability' as const, label: '待认定', count: stats.pendingLiability, icon: <Scale className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50', activeBg: 'bg-amber-100 ring-2 ring-amber-300', filterValue: null },
  ]

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

      <div className="grid grid-cols-4 gap-3 mb-5">
        {statCards.map(card => {
          const isActive = card.filterValue
            ? flagFilter === card.filterValue
            : statusFilter === '待认定' && flagFilter === '全部'
          return (
            <button
              key={card.key}
              onClick={() => {
                if (card.filterValue) {
                  setFlagFilter(flagFilter === card.filterValue ? '全部' : card.filterValue)
                } else {
                  setStatusFilter(statusFilter === '待认定' ? '全部' : '待认定')
                  setFlagFilter('全部')
                }
              }}
              className={clsx(
                'card p-4 text-left transition-all hover:shadow-md',
                isActive ? card.activeBg : ''
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-surface-500">{card.label}</span>
                <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', card.bg, card.color)}>
                  {card.icon}
                </div>
              </div>
              <div className={clsx('text-2xl font-bold', card.color)}>{card.count}</div>
            </button>
          )
        })}
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
            {hasActiveFilters && (
              <button className="btn-ghost text-red-600 hover:bg-red-50" onClick={clearAllFilters}>
                <X className="w-4 h-4" />
                清空筛选
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {flagFilters.map(f => (
              <button
                key={f}
                onClick={() => setFlagFilter(f)}
                className={clsx(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  flagFilter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                )}
              >
                {flagLabels[f]}
              </button>
            ))}
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
            description="当前筛选条件下没有找到匹配记录"
            action={
              hasActiveFilters ? (
                <button className="btn-primary" onClick={clearAllFilters}>
                  清空所有筛选
                </button>
              ) : undefined
            }
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
                    {record.flag && <FlagBadge flag={record.flag} />}
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
