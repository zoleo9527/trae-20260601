import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, 
  Wrench, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { orderApi } from '../api'
import { useAppStore } from '../store'
import type { Order } from '../types'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待接单', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  inspection_pending: { label: '待质检', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  warranty_pending: { label: '待保修确认', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  repairing: { label: '维修中', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' }
}

export default function Dashboard() {
  const orders = useAppStore(state => state.orders)
  const setOrders = useAppStore(state => state.setOrders)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderApi.getAll().then(data => {
      setOrders(data)
      setLoading(false)
    })
  }, [setOrders])

  const stats = [
    { 
      label: '总工单', 
      value: orders.length, 
      icon: ClipboardList, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    },
    { 
      label: '待处理', 
      value: orders.filter(o => ['pending', 'inspection_pending', 'warranty_pending'].includes(o.status)).length, 
      icon: AlertCircle, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50' 
    },
    { 
      label: '维修中', 
      value: orders.filter(o => o.status === 'repairing').length, 
      icon: Wrench, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50' 
    },
    { 
      label: '已完成', 
      value: orders.filter(o => o.status === 'completed').length, 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    }
  ]

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">最近工单</h3>
            <Link to="/orders" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无工单</div>
            ) : (
              recentOrders.map((order: Order) => (
                <Link 
                  key={order.id} 
                  to={`/orders/${order.id}`}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].bgColor} ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.customer_name} - {order.device_model}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {order.created_at.split(' ')[0]}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">状态分布</h3>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orders.filter(o => o.status === status).length
              const percentage = orders.length > 0 ? (count / orders.length * 100).toFixed(0) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{config.label}</span>
                    <span className={config.color}>{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${config.bgColor.replace('50', '500')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">今日任务提醒</h3>
            <p className="text-blue-100 mt-1">请及时处理待办工单</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'inspection_pending').length}</p>
            <p className="text-blue-100 text-sm">待质检</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'warranty_pending').length}</p>
            <p className="text-blue-100 text-sm">待保修确认</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'repairing').length}</p>
            <p className="text-blue-100 text-sm">维修中</p>
          </div>
        </div>
      </div>
    </div>
  )
}