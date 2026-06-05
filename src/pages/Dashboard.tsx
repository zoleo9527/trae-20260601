import Layout from '@/components/Layout'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import type { Order } from '@/shared/types'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Clock,
    Eye,
    Package,
    RotateCcw,
    Truck,
    XCircle,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const { orders, fetchOrders, isLoading } = useOrdersStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const stats = useMemo(() => {
    const pendingConfirm = orders.filter((o) => o.status === 'PENDING_CONFIRM').length
    const inProduction = orders.filter((o) => o.status === 'IN_PRODUCTION').length
    const readyToShip = orders.filter((o) => o.status === 'READY_TO_SHIP').length
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length
    const completed = orders.filter((o) => o.status === 'COMPLETED').length
    const returned = orders.filter((o) => o.status === 'RETURNED').length
    const exception = orders.filter((o) => o.status === 'EXCEPTION').length

    return {
      pendingConfirm,
      inProduction,
      readyToShip,
      shipped,
      completed,
      returned,
      exception,
      totalAbnormal: returned + exception,
    }
  }, [orders])

  const hasAbnormal = stats.totalAbnormal > 0

  const getOverdueOrders = (): Order[] => {
    const now = new Date()
    return orders.filter((o) => {
      if (['COMPLETED', 'DRAFT'].includes(o.status)) return false
      const updatedAt = new Date(o.updatedAt)
      const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
      return diffHours > 24
    })
  }

  const overdueOrders = getOverdueOrders()
  const hasOverdue = overdueOrders.length > 0

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const abnormalOrders = orders.filter(
    (o) => o.status === 'RETURNED' || o.status === 'EXCEPTION'
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '今天'
    if (diff === 1) return '昨天'
    return `${diff}天前`
  }

  return (
    <Layout title="工作台">
      <div className="space-y-6">
        {hasAbnormal && (
          <div
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => navigate('/orders?status=ABNORMAL')}
          >
            <div className="relative">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {stats.totalAbnormal}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">
                存在 {stats.totalAbnormal} 条异常订单需要处理
              </p>
              <p className="text-sm text-red-600">
                {stats.returned > 0 && `${stats.returned} 条退回订单 `}
                {stats.exception > 0 && `${stats.exception} 条异常订单`}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </div>
        )}

        {hasOverdue && !hasAbnormal && (
          <div
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => navigate('/orders')}
          >
            <div className="relative">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-white text-xs flex items-center justify-center">
                {overdueOrders.length}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {overdueOrders.length} 条订单超过 24 小时未处理
              </p>
              <p className="text-sm text-amber-600">请及时跟进，避免影响交货时效</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div
            className="bg-stone-50 rounded-xl p-4 border border-stone-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/orders?status=PENDING_CONFIRM')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-200 rounded-lg">
                <ClipboardList className="w-5 h-5 text-stone-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.pendingConfirm}</p>
                <p className="text-xs text-stone-500">待确认</p>
              </div>
            </div>
          </div>

          <div
            className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/orders?status=IN_PRODUCTION')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Package className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.inProduction}</p>
                <p className="text-xs text-blue-600">生产中</p>
              </div>
            </div>
          </div>

          <div
            className="bg-amber-50 rounded-xl p-4 border border-amber-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/orders?status=READY_TO_SHIP')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200 rounded-lg">
                <Package className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{stats.readyToShip}</p>
                <p className="text-xs text-amber-600">待发货</p>
              </div>
            </div>
          </div>

          <div
            className="bg-teal-50 rounded-xl p-4 border border-teal-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/shipments')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-200 rounded-lg">
                <Truck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-900">{stats.shipped}</p>
                <p className="text-xs text-teal-600">运输中</p>
              </div>
            </div>
          </div>

          <div
            className="bg-green-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/orders?status=COMPLETED')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                <p className="text-xs text-green-600">已完成</p>
              </div>
            </div>
          </div>

          <div
            className="bg-red-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/orders?status=ABNORMAL')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{stats.totalAbnormal}</p>
                <p className="text-xs text-red-600">异常</p>
              </div>
            </div>
          </div>
        </div>

        {hasOverdue && (
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                超时未处理订单
              </h3>
              <span className="text-sm text-amber-600">超过 24 小时未更新状态</span>
            </div>
            <div className="divide-y divide-amber-50">
              {overdueOrders.slice(0, 3).map((order) => {
                const hoursAgo = Math.floor(
                  (new Date().getTime() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60)
                )
                return (
                  <div
                    key={order.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{order.orderNo}</p>
                        <p className="text-sm text-stone-500">{order.distributorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={order.status} />
                      <span className="text-sm text-amber-600 font-medium">
                        超时 {hoursAgo} 小时
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {abnormalOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center justify-between">
              <h3 className="font-semibold text-red-900 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                异常订单处理
              </h3>
              <button
                onClick={() => navigate('/orders?status=ABNORMAL')}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                查看全部
              </button>
            </div>
            <div className="divide-y divide-red-50">
              {abnormalOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-red-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-1.5 rounded-lg',
                        order.status === 'RETURNED' ? 'bg-orange-100' : 'bg-red-100'
                      )}
                    >
                      {order.status === 'RETURNED' ? (
                        <RotateCcw className="w-4 h-4 text-orange-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{order.orderNo}</p>
                      <p className="text-sm text-stone-500">{order.distributorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <p className="text-xs text-stone-500 mt-1">
                        {getDaysAgo(order.updatedAt)}更新
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">最近订单</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              查看全部
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    经销商
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                      加载中...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-stone-500">
                      暂无订单
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium text-stone-900">{order.orderNo}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-stone-600">
                        {order.distributorName}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-stone-500 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
