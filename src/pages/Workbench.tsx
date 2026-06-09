import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useReturnStore } from '@/store/returnStore'
import Sidebar from '@/components/Sidebar'
import StatusBadge from '@/components/StatusBadge'
import CreateReturnDrawer from '@/components/CreateReturnDrawer'
import { Search, Plus, Filter, ChevronRight, ChevronDown, Package, RotateCcw, User, Calendar, X } from 'lucide-react'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '待派件员确认', label: '待派件员确认' },
  { value: '待驿站认定', label: '待驿站认定' },
  { value: '已驳回-待补录', label: '已驳回-待补录' },
  { value: '已驳回-待客服补录', label: '已驳回-待客服补录' },
  { value: '退回处理完成', label: '退回处理完成' },
  { value: '复盘进行中', label: '复盘进行中' },
  { value: '复盘完成', label: '复盘完成' },
]

const quickFilters = [
  { value: '', label: '全部' },
  { value: '__pending', label: '待处理' },
  { value: '__rejected', label: '被驳回' },
  { value: '__review', label: '复盘' },
]

const statColors: Record<string, { bg: string; text: string; border: string }> = {
  '待派件员确认': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '待驿站认定': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '已驳回-待补录': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '已驳回-待客服补录': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  '退回处理完成': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '复盘进行中': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '复盘完成': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

export default function Workbench() {
  const user = useAuthStore((s) => s.user)
  const {
    returns, pagination, filters, loading, statusStats, users,
    fetchReturns, setFilters, setPage, fetchUsers,
  } = useReturnStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchReturns()
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchReturns()
  }, [pagination.page, filters.status, filters.keyword, filters.assigneeId, filters.startDate, filters.endDate])

  const handleQuickFilter = (value: string) => {
    setQuickFilter(value)
    if (value === '') {
      setFilters({ status: '' })
    } else if (value === '__pending') {
      setFilters({ status: '' })
    } else if (value === '__rejected') {
      setFilters({ status: '' })
    } else if (value === '__review') {
      setFilters({ status: '' })
    }
  }

  const filteredReturns = returns.filter((item) => {
    if (quickFilter === '__pending') {
      return ['待派件员确认', '待驿站认定'].includes(item.status)
    }
    if (quickFilter === '__rejected') {
      return ['已驳回-待补录', '已驳回-待客服补录'].includes(item.status)
    }
    if (quickFilter === '__review') {
      return ['退回处理完成', '复盘进行中', '复盘完成'].includes(item.status)
    }
    return true
  })

  const hasActiveExtraFilters = filters.assigneeId || filters.startDate || filters.endDate

  const clearExtraFilters = () => {
    setFilters({ assigneeId: '', startDate: '', endDate: '' })
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  const statEntries = Object.entries(statusStats)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">退回工作台</h2>
            <p className="text-sm text-slate-500 mt-1">管理退回件全流程，从处理到复盘一站式完成</p>
          </div>

          {statEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
              {statEntries.map(([status, count]) => {
                const colors = statColors[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
                return (
                  <button
                    key={status}
                    onClick={() => setFilters({ status: filters.status === status ? '' : status })}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      filters.status === status
                        ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-orange-400`
                        : `${colors.bg} ${colors.border} hover:shadow-sm`
                    }`}
                  >
                    <p className={`text-lg font-bold ${colors.text}`}>{count}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate" title={status}>{status}</p>
                  </button>
                )
              })}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ status: e.target.value })}
                    className="pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters({ keyword: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && fetchReturns()}
                    placeholder="搜索运单号..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    showMoreFilters || hasActiveExtraFilters
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  更多筛选
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
                </button>

                {user?.role === '客服' && (
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors ml-auto"
                  >
                    <Plus className="w-4 h-4" />
                    登记退回件
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {quickFilters.map((qf) => (
                  <button
                    key={qf.value}
                    onClick={() => handleQuickFilter(qf.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      quickFilter === qf.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>

              {showMoreFilters && (
                <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
                  <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      <User className="w-3 h-3 inline mr-1" />
                      当前处理人
                    </label>
                    <div className="relative">
                      <select
                        value={filters.assigneeId}
                        onChange={(e) => setFilters({ assigneeId: e.target.value })}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                      >
                        <option value="">全部处理人</option>
                        {users.map((u) => (
                          <option key={u.id} value={String(u.id)}>{u.displayName}（{u.role}）</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      更新起始日期
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div className="min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      更新截止日期
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {hasActiveExtraFilters && (
                    <button
                      onClick={clearExtraFilters}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      清除筛选
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Package className="w-12 h-12 mb-3" />
                <p className="text-sm">暂无退回件记录</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">运单号</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">退回原因</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">创建人</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">当前处理人</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">更新时间</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReturns.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/return/${item.id}`)}
                        >
                          <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {['复盘进行中', '复盘完成'].includes(item.status) && (
                                <RotateCcw className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                              )}
                              {item.trackingNo}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">{item.reason}</td>
                          <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{item.createdByName || '-'}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 hidden md:table-cell">{item.assignedToName || '-'}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 hidden md:table-cell">{item.updatedAt}</td>
                          <td className="px-4 py-3.5 text-right">
                            <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                      共 {pagination.total} 条，第 {pagination.page}/{totalPages} 页
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, pagination.page + 1))}
                        disabled={pagination.page >= totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <CreateReturnDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
