import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useReturnStore } from '@/store/returnStore'
import Sidebar from '@/components/Sidebar'
import StatusBadge from '@/components/StatusBadge'
import CreateReturnDrawer from '@/components/CreateReturnDrawer'
import { Search, Plus, Filter, ChevronRight, ChevronDown, Package, RotateCcw } from 'lucide-react'

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

export default function Workbench() {
  const user = useAuthStore((s) => s.user)
  const { returns, pagination, filters, loading, fetchReturns, setFilters, setPage } = useReturnStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchReturns()
  }, [pagination.page, filters.status, filters.keyword])

  const handleSearch = () => {
    fetchReturns()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

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

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">退回工作台</h2>
            <p className="text-sm text-slate-500 mt-1">管理退回件全流程，从处理到复盘一站式完成</p>
          </div>

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
                    onKeyDown={handleKeyDown}
                    placeholder="搜索运单号..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                  />
                </div>

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
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">创建时间</th>
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
                          <td className="px-4 py-3.5 text-sm text-slate-500 hidden md:table-cell">{item.createdAt}</td>
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
