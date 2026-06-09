import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, Phone, Bell, ArrowRight, TrendingUp } from 'lucide-react'
import { ProblemStatusBadge } from '@/components/StatusBadge'
import { PROBLEM_TYPE_LABELS, PROBLEM_STATUS_LABELS, type ProblemStatus, type ProblemType } from '../../shared/types'

const FILTER_GROUPS: { key: string; statuses: ProblemStatus[]; label: string }[] = [
  { key: 'pending_supplementing', statuses: ['pending', 'supplementing'], label: '待处理' },
  { key: 'contacting', statuses: ['contacting'], label: '联系中' },
  { key: 'reviewing', statuses: ['reviewing'], label: '复核中' },
  { key: 'returned', statuses: ['returned'], label: '已退回' },
  { key: 'closed', statuses: ['closed', 'resolved'], label: '已关闭' },
]

function toUrlStatus(statuses: ProblemStatus[]): string {
  return statuses.join(',')
}

function getFilterLabel(urlStatus: string): string {
  const group = FILTER_GROUPS.find((g) => toUrlStatus(g.statuses) === urlStatus)
  if (group) return group.label
  const single = urlStatus.split(',')[0] as ProblemStatus
  return PROBLEM_STATUS_LABELS[single] || single
}

export default function Dashboard() {
  const { problems, deliveries, notifications, unreadCount, loadProblems, loadDeliveries, loadNotifications } = useAppStore()
  const [problemFilter, setProblemFilter] = useState<string>('')

  useEffect(() => {
    loadDeliveries()
    loadProblems(problemFilter ? { status: problemFilter } : undefined)
    loadNotifications()
  }, [problemFilter])

  const pendingProblems = problems.filter((p) => p.status === 'pending' || p.status === 'supplementing')
  const contactingProblems = problems.filter((p) => p.status === 'contacting')
  const reviewingProblems = problems.filter((p) => p.status === 'reviewing')
  const problemDeliveries = deliveries.filter((d) => d.status === 'problem')
  const recentNotifications = notifications.slice(0, 6)

  const statusCounts = FILTER_GROUPS.map((g) => ({
    key: g.key,
    urlStatus: toUrlStatus(g.statuses),
    count: problems.filter((p) => g.statuses.includes(p.status as ProblemStatus)).length,
    label: g.label,
    color: g.key === 'pending_supplementing' ? 'text-yellow-600'
      : g.key === 'contacting' ? 'text-blue-600'
      : g.key === 'reviewing' ? 'text-purple-600'
      : g.key === 'returned' ? 'text-gray-600'
      : 'text-slate-500',
  }))

  const filterButtons: { value: string; label: string }[] = [
    { value: '', label: '全部' },
    ...FILTER_GROUPS.map((g) => ({ value: toUrlStatus(g.statuses), label: g.label })),
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">工作台概览</h2>
        <p className="text-sm text-slate-500 mt-1">快递网点问题件登记与客户联系管理</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Link to={`/problems?status=${toUrlStatus(['pending', 'supplementing'])}`} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">待处理问题件</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingProblems.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-xs text-blue-600 hover:underline mt-2">查看详情 →</p>
        </Link>

        <Link to={`/problems?status=contacting`} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">联系中</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{contactingProblems.length}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-xs text-blue-600 hover:underline mt-2">查看详情 →</p>
        </Link>

        <Link to={`/problems?status=reviewing`} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">待复核</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{reviewingProblems.length}</p>
            </div>
            <Package className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xs text-blue-600 hover:underline mt-2">查看详情 →</p>
        </Link>

        <Link to="/notifications" className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">未读提醒</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unreadCount}</p>
            </div>
            <Bell className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-xs text-blue-600 hover:underline mt-2">查看详情 →</p>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> 问题件状态分布
              </h3>
              <div className="flex gap-1">
                {filterButtons.map((fb) => (
                  <button
                    key={fb.value}
                    onClick={() => setProblemFilter(fb.value)}
                    className={`text-xs px-2 py-1 rounded ${problemFilter === fb.value ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {fb.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-50">
              <div className="flex gap-3">
                {statusCounts.map((sc) => (
                  <div key={sc.key} className="flex-1 text-center">
                    <p className={`text-lg font-bold ${sc.color}`}>{sc.count}</p>
                    <p className="text-xs text-slate-400">{sc.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4">
              {problems.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {problems.slice(0, 8).map((p) => (
                    <Link
                      key={p.id}
                      to={`/problems/${p.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-slate-600">{p.trackingNumber}</span>
                        <ProblemStatusBadge status={p.status as ProblemStatus} />
                        <span className="text-xs text-slate-400 bg-slate-50 rounded px-1.5 py-0.5">
                          {PROBLEM_TYPE_LABELS[p.problemType as ProblemType] || p.problemType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{p.responsiblePersonName}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/problems" className="text-xs text-blue-600 hover:underline mt-2 block text-center">
                查看全部问题件 →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">派件概况</h3>
              <Link to="/deliveries" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                查看全部 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 text-center bg-yellow-50 rounded py-2">
                  <p className="text-lg font-bold text-yellow-600">{deliveries.filter((d) => d.status === 'pending').length}</p>
                  <p className="text-xs text-slate-400">待派送</p>
                </div>
                <div className="flex-1 text-center bg-blue-50 rounded py-2">
                  <p className="text-lg font-bold text-blue-600">{deliveries.filter((d) => d.status === 'delivering').length}</p>
                  <p className="text-xs text-slate-400">派送中</p>
                </div>
                <div className="flex-1 text-center bg-green-50 rounded py-2">
                  <p className="text-lg font-bold text-green-600">{deliveries.filter((d) => d.status === 'delivered').length}</p>
                  <p className="text-xs text-slate-400">已签收</p>
                </div>
                <div className="flex-1 text-center bg-red-50 rounded py-2">
                  <p className="text-lg font-bold text-red-600">{problemDeliveries.length}</p>
                  <p className="text-xs text-slate-400">问题件</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">最近提醒</h3>
              <Link to="/notifications" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                全部 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">暂无提醒</p>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.sourceType === 'problem' ? `/problems/${n.sourceId}` : '/notifications'}
                      className={`flex items-start gap-3 py-2 px-3 rounded transition-colors ${n.isRead ? 'opacity-60 hover:bg-slate-50' : 'bg-blue-50 hover:bg-blue-100'}`}
                    >
                      <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{n.content}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.createdAt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">快速操作</h4>
            <div className="space-y-2">
              <Link to="/problems/new" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> 新建问题件登记
              </Link>
              <Link to={`/problems?status=${toUrlStatus(['pending', 'supplementing'])}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <AlertTriangle className="w-4 h-4 text-yellow-600" /> 待处理问题件
              </Link>
              <Link to="/problems?status=contacting" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <Phone className="w-4 h-4 text-blue-500" /> 联系中问题件
              </Link>
              <Link to="/problems?status=reviewing" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <Package className="w-4 h-4 text-purple-500" /> 待复核问题件
              </Link>
              <Link to="/contacts?status=pending,supplementing" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <Phone className="w-4 h-4 text-green-500" /> 待联系问题件
              </Link>
              <Link to="/contacts?status=contacting" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 py-1.5 px-2 rounded hover:bg-blue-50 transition-colors">
                <Phone className="w-4 h-4 text-blue-500" /> 联系中跟进
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
