import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  ArrowRight,
  Filter,
  Download,
  ExternalLink,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { useLogsStore } from '@/stores/logs'
import type { AuditLog } from '@/shared/types'
import type { OrderStatus } from '@/shared/types'
import { cn } from '@/lib/utils'

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'CREATE', label: '创建订单' },
  { value: 'CONFIRM', label: '确认生产' },
  { value: 'COMPLETE_PRODUCTION', label: '生产完成' },
  { value: 'SHIP', label: '确认发货' },
  { value: 'RECEIVE', label: '确认签收' },
  { value: 'RETURN', label: '退回' },
  { value: 'MARK_EXCEPTION', label: '标记异常' },
  { value: 'RESUBMIT', label: '重新提交' },
  { value: 'CONFIRM_SHIPMENT', label: '确认物流' },
  { value: 'CONFIRM_RECEIVE', label: '确认签收' },
]

const roleOptions = [
  { value: '', label: '全部角色' },
  { value: 'SALES', label: '销售内勤' },
  { value: 'BREWER', label: '酿酒师' },
  { value: 'PACKER', label: '包装主管' },
  { value: 'ADMIN', label: '管理员' },
]

const roleDisplayNames: Record<string, string> = {
  SALES: '销售内勤',
  BREWER: '酿酒师',
  PACKER: '包装主管',
  ADMIN: '管理员',
}

const actionDisplayNames: Record<string, string> = {
  CREATE: '创建订单',
  CONFIRM: '确认生产',
  COMPLETE_PRODUCTION: '生产完成',
  SHIP: '确认发货',
  RECEIVE: '确认签收',
  RETURN: '退回',
  MARK_EXCEPTION: '标记异常',
  RESUBMIT: '重新提交',
  CONFIRM_SHIPMENT: '确认物流',
  CONFIRM_RECEIVE: '确认签收',
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  CONFIRM: 'bg-amber-100 text-amber-800',
  COMPLETE_PRODUCTION: 'bg-indigo-100 text-indigo-800',
  SHIP: 'bg-teal-100 text-teal-800',
  RECEIVE: 'bg-green-100 text-green-800',
  RETURN: 'bg-red-100 text-red-800',
  MARK_EXCEPTION: 'bg-red-100 text-red-800',
  RESUBMIT: 'bg-purple-100 text-purple-800',
  CONFIRM_SHIPMENT: 'bg-teal-100 text-teal-800',
  CONFIRM_RECEIVE: 'bg-green-100 text-green-800',
}

const roleColors: Record<string, string> = {
  SALES: 'bg-amber-100 text-amber-700',
  BREWER: 'bg-blue-100 text-blue-700',
  PACKER: 'bg-teal-100 text-teal-700',
  ADMIN: 'bg-purple-100 text-purple-700',
}

export default function Logs() {
  const navigate = useNavigate()
  const { logs, total, page, totalPages, isLoading, fetchLogs } = useLogsStore()
  const [actionType, setActionType] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [searchOrderNo, setSearchOrderNo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [actionType, roleFilter, page])

  const fetchData = () => {
    const filters: Record<string, unknown> = { page }
    if (actionType) {
      filters.action = actionType
    }
    if (roleFilter) {
      filters.role = roleFilter
    }
    if (searchOrderNo) {
      filters.orderNo = searchOrderNo
    }
    if (startDate) {
      filters.startDate = startDate
    }
    if (endDate) {
      filters.endDate = endDate
    }
    fetchLogs(filters)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleReset = () => {
    setActionType('')
    setRoleFilter('')
    setSearchOrderNo('')
    setStartDate('')
    setEndDate('')
    useLogsStore.setState({ page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    useLogsStore.setState({ page: newPage })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-stone-100 text-stone-800'
  }

  const getRoleColor = (role: string) => {
    return roleColors[role] || 'bg-stone-100 text-stone-800'
  }

  const getRoleDisplayName = (role: string) => {
    return roleDisplayNames[role] || role
  }

  const getActionDisplayName = (action: string) => {
    return actionDisplayNames[action] || action
  }

  const stats = useMemo(() => {
    const actionCounts: Record<string, number> = {}
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })
    return actionCounts
  }, [logs])

  return (
    <Layout title="操作日志">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">操作日志</h1>
            <p className="text-sm text-stone-500 mt-1">
              记录所有订单操作，确保责任可追溯
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                showFilters
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              )}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    操作类型
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {actionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    操作角色
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    订单号
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={searchOrderNo}
                      onChange={(e) => setSearchOrderNo(e.target.value)}
                      placeholder="搜索订单号..."
                      className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-medium"
                >
                  重置
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors"
                >
                  <Search className="w-4 h-4" />
                  搜索
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(actionDisplayNames).map(([action, label]) => (
            <div
              key={action}
              className={cn(
                'rounded-lg p-3 border cursor-pointer transition-all',
                actionType === action
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              )}
              onClick={() => {
                setActionType(actionType === action ? '' : action)
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getActionColor(action)
                  )}
                >
                  {label}
                </span>
                <span className="text-lg font-bold text-stone-900">
                  {stats[action] || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    关联订单
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    状态变更
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    备注
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
                      <p className="mt-2 text-stone-500">加载中...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-stone-500">
                      <FileText className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                      暂无操作日志
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Clock className="w-4 h-4 text-stone-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-stone-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {log.user?.displayName || log.user?.username || '-'}
                            </p>
                            <p className="text-xs text-stone-500">
                              @{log.user?.username || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getRoleColor(log.user?.role || '')
                          )}
                        >
                          {getRoleDisplayName(log.user?.role || '')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getActionColor(log.action)
                          )}
                        >
                          {getActionDisplayName(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                        {log.order?.orderNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {log.fromStatus && (
                            <StatusBadge status={log.fromStatus as OrderStatus} size="sm" />
                          )}
                          {log.fromStatus && log.toStatus && (
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                          )}
                          {log.toStatus && (
                            <StatusBadge status={log.toStatus as OrderStatus} size="sm" />
                          )}
                          {!log.fromStatus && !log.toStatus && (
                            <span className="text-stone-400 text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate">
                        {log.remark || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {log.orderId && (
                          <button
                            onClick={() => navigate(`/orders/${log.orderId}`)}
                            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                          >
                            查看订单
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
              <p className="text-sm text-stone-600">
                共 {total} 条记录，第 {page} / {totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      p === page
                        ? 'bg-amber-600 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
