import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, Phone, Bell, ArrowRight } from 'lucide-react'
import { ProblemStatusBadge } from '@/components/StatusBadge'
import type { ProblemStatus } from '../../shared/types'

export default function Dashboard() {
  const { problems, deliveries, notifications, unreadCount, loadProblems, loadDeliveries, loadNotifications } = useAppStore()
  const [problemFilter, setProblemFilter] = useState<ProblemStatus | ''>('')

  useEffect(() => {
    loadDeliveries()
    loadProblems(problemFilter ? { status: problemFilter } : undefined)
    loadNotifications()
  }, [problemFilter])

  const pendingProblems = problems.filter((p) => p.status === 'pending' || p.status === 'supplementing')
  const contactingProblems = problems.filter((p) => p.status === 'contacting')
  const reviewingProblems = problems.filter((p) => p.status === 'reviewing')
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">工作台概览</h2>
        <p className="text-sm text-slate-500 mt-1">快递网点问题件登记与客户联系管理</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">待处理问题件</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingProblems.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <Link to="/problems?status=pending" className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看详情 →</Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">联系中</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{contactingProblems.length}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-400" />
          </div>
          <Link to="/problems?status=contacting" className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看详情 →</Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">待复核</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{reviewingProblems.length}</p>
            </div>
            <Package className="w-8 h-8 text-purple-400" />
          </div>
          <Link to="/problems?status=reviewing" className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看详情 →</Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">未读提醒</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unreadCount}</p>
            </div>
            <Bell className="w-8 h-8 text-red-400" />
          </div>
          <Link to="/notifications" className="text-xs text-blue-600 hover:underline mt-2 inline-block">查看详情 →</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">问题件状态分布</h3>
            <div className="flex gap-1">
              {(['', 'pending', 'contacting', 'returned', 'reviewing', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setProblemFilter(s)}
                  className={`text-xs px-2 py-1 rounded ${problemFilter === s ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {s === '' ? '全部' : ''}
                </button>
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
                    </div>
                    <span className="text-xs text-slate-400">{p.responsiblePersonName}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">最近提醒</h3>
            <Link to="/notifications" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">暂无提醒</p>
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 py-2 px-3 rounded ${n.isRead ? 'opacity-60' : 'bg-blue-50'}`}
                  >
                    <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.content}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
