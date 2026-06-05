import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { useOrdersStore } from '@/stores/orders'
import { useAuthStore } from '@/stores/auth'
import type { OrderStatus, Order, AuditLog } from '@/shared/types'
import { cn } from '@/lib/utils'

type StatusFilterValue = OrderStatus | 'ALL' | 'ABNORMAL'

const statusOptions: { value: StatusFilterValue; label: string; highlight?: boolean }[] = [
  { value: 'ALL', label: '全部状态' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING_CONFIRM', label: '待确认' },
  { value: 'IN_PRODUCTION', label: '生产中' },
  { value: 'READY_TO_SHIP', label: '待发货' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ABNORMAL', label: '🔴 异常订单', highlight: true },
  { value: 'RETURNED', label: '已退回' },
  { value: 'EXCEPTION', label: '异常' },
]

const getAbnormalReason = (order: Order): string | null => {
  const logs = order.auditLogs || []
  const abnormalLogs = logs.filter(
    (log: AuditLog) => log.action === 'RETURN' || log.action === 'MARK_EXCEPTION'
  )
  if (abnormalLogs.length === 0) return null
  const latest = abnormalLogs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
  return latest?.remark || (latest.action === 'RETURN' ? '订单已退回' : '订单标记为异常')
}

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { orders, total, page, totalPages, isLoading, fetchOrders } = useOrdersStore()

  const urlStatus = searchParams.get('status') as StatusFilterValue | null
  const initialStatus = urlStatus && statusOptions.some(o => o.value === urlStatus)
    ? urlStatus
    : 'ALL'
  
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatus)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrders = useMemo(() => {
    let result = [...orders]
    if (statusFilter === 'ABNORMAL') {
      result = result.filter(o => o.status === 'RETURNED' || o.status === 'EXCEPTION')
    } else if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter)
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(o =>
        o.orderNo.toLowerCase().includes(term) ||
        o.distributorName.toLowerCase().includes(term)
      )
    }
    return result
  }, [orders, statusFilter, searchTerm])

  const loadOrders = useCallback((currentPage: number) => {
    fetchOrders({
      status: statusFilter === 'ALL' || statusFilter === 'ABNORMAL' ? undefined : statusFilter,
      search: searchTerm || undefined,
      page: currentPage,
    })
  }, [statusFilter, searchTerm, fetchOrders])

  useEffect(() => {
    if (urlStatus && statusOptions.some(o => o.value === urlStatus)) {
      setStatusFilter(urlStatus)
    }
  }, [urlStatus])

  useEffect(() => {
    loadOrders(1)
  }, [statusFilter])

  const handleSearch = () => {
    loadOrders(1)
  }

  const handlePageChange = (newPage: number) => {
    loadOrders(newPage)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">经销订单</h1>
          {user?.role === 'SALES' && (
            <Link
              to="/orders/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              新建订单
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                订单状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                经销商名称
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入经销商名称搜索"
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-md hover:bg-stone-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              搜索
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          {isLoading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-stone-500">
              暂无订单数据
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        订单号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        经销商
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        异常原因
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        交货日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        创建人
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        更新时间
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredOrders.map((order) => {
                      const isAbnormal = order.status === 'RETURNED' || order.status === 'EXCEPTION'
                      const abnormalReason = isAbnormal ? getAbnormalReason(order) : null

                      return (
                        <tr
                          key={order.id}
                          className={cn(
                            'hover:bg-stone-50 transition-colors',
                            isAbnormal && 'bg-red-50/30'
                          )}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-stone-900">
                            {order.orderNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-700">
                            {order.distributorName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            {abnormalReason ? (
                              <div className="flex items-start gap-1.5">
                                {order.status === 'RETURNED' ? (
                                  <RotateCcw className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                                <span className="text-sm text-stone-600 truncate">
                                  {abnormalReason}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-stone-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-700">
                            {formatDate(order.deliveryDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-700">
                            {order.createdBy?.displayName || order.createdBy?.username || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-500">
                            {formatDateTime(order.updatedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-amber-600 hover:text-amber-700 font-medium"
                            >
                              查看
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between">
                <div className="text-sm text-stone-500">
                  共 {filteredOrders.length} 条记录
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || isLoading}
                    className="p-2 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={cn(
                        'min-w-[36px] h-9 px-2 rounded-md text-sm font-medium transition-colors',
                        pageNum === page
                          ? 'bg-amber-600 text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || isLoading}
                    className="p-2 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
