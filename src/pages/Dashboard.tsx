import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, RotateCcw, TrendingUp, ArrowRight, Siren } from 'lucide-react'
import clsx from 'clsx'
import { useAppState } from '@/context/AppContext'
import { buildDashboardItems } from '@/data/mock'
import { SeverityBadge, StatusBadge, FlagBadge, CategoryBadge } from '@/components/Badges'
import type { TaskFlag, DashboardItem } from '@/types'

function ItemRow({ item, onAction }: { item: DashboardItem; onAction: (id: string) => void }) {
  return (
    <div
      className={clsx(
        'group flex items-start gap-4 px-5 py-4 border-b border-surface-100 hover:bg-surface-50/60 transition-colors cursor-pointer',
        item.isUrgent && 'bg-red-50/30'
      )}
      onClick={() => onAction(item.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-mono font-semibold text-surface-800">{item.awb}</span>
          <span className="text-xs text-surface-400">·</span>
          <span className="text-xs text-surface-500">{item.flightNo}</span>
          <CategoryBadge category={item.category} />
          <SeverityBadge severity={item.severity} />
          <StatusBadge status={item.status} />
          <FlagBadge flag={item.flag} />
          {item.isUrgent && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-bold">
              <Siren className="w-3 h-3" />
              紧急
            </span>
          )}
        </div>
        <p className="text-sm text-surface-600 leading-relaxed line-clamp-2">{item.summary}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
          <span>{item.time}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-surface-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TaskFlag | 'all'>('all')
  const navigate = useNavigate()
  const { state } = useAppState()

  const dashboardItems = useMemo(() => buildDashboardItems(state.damageRecords), [state.damageRecords])

  const flagTabs: { key: TaskFlag | 'all'; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: '全部', icon: <TrendingUp className="w-4 h-4" />, count: dashboardItems.length },
    { key: 'today', label: '今日待办', icon: <Clock className="w-4 h-4" />, count: dashboardItems.filter(d => d.flag === 'today').length },
    { key: 'overdue', label: '已拖延', icon: <AlertTriangle className="w-4 h-4" />, count: dashboardItems.filter(d => d.flag === 'overdue').length },
    { key: 'returned', label: '被退回', icon: <RotateCcw className="w-4 h-4" />, count: dashboardItems.filter(d => d.flag === 'returned').length },
  ]

  const stats = useMemo(() => ({
    today: dashboardItems.filter(d => d.flag === 'today').length,
    overdue: dashboardItems.filter(d => d.flag === 'overdue').length,
    returned: dashboardItems.filter(d => d.flag === 'returned').length,
    urgent: dashboardItems.filter(d => d.isUrgent).length,
  }), [dashboardItems])

  const filteredItems = activeTab === 'all'
    ? dashboardItems
    : dashboardItems.filter(d => d.flag === activeTab)

  function handleAction(id: string) {
    navigate(`/damage/${id}`)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">工作台</h1>
        <p className="text-sm text-surface-500 mt-1">今日待办、拖延和退回事项一览，优先处理紧急事项</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-surface-500">今日待办</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-surface-900">{stats.today}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-surface-500">已拖延</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-surface-500">被退回</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.returned}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-surface-500">紧急事项</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Siren className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-surface-900">{stats.urgent}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-surface-800">待处理事项</h2>
          <span className="text-xs text-surface-400">共 {filteredItems.length} 条</span>
        </div>

        <div className="flex border-b border-surface-200 px-5">
          {flagTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={clsx(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold',
                activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-surface-400">当前分类下暂无事项</div>
        ) : (
          <div>
            {filteredItems.map(item => (
              <ItemRow key={item.id} item={item} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
