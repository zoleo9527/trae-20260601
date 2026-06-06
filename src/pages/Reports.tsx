import { useStore } from '@/store'
import {
  TrendingUp,
  Package,
  Film,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'

export default function Reports() {
  const { inventoryItems, screenings, exceptions, todos } = useStore()

  const totalDiscrepancy = inventoryItems.reduce((sum, item) => sum + Math.abs(item.discrepancy), 0)
  const totalTickets = screenings.reduce((sum, s) => sum + s.soldTickets, 0)
  const totalRefunds = screenings.reduce((sum, s) => sum + s.refundCount, 0)
  const resolvedExceptions = exceptions.filter((e) => e.status === 'resolved').length
  const completedTodos = todos.filter((t) => t.completed).length

  const stats = [
    { label: '总售票数', value: totalTickets, icon: Film, color: 'text-primary-600 bg-primary-50' },
    { label: '总退票数', value: totalRefunds, icon: AlertTriangle, color: 'text-danger-600 bg-danger-50' },
    { label: '库存差异总数', value: totalDiscrepancy, icon: Package, color: 'text-warning-600 bg-warning-50' },
    { label: '已解决异常', value: resolvedExceptions, icon: TrendingUp, color: 'text-success-600 bg-success-50' },
  ]

  const inventoryByCategory = inventoryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const screeningByStatus = screenings.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
        <p className="text-gray-500 mt-1">运营数据概览与分析</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">库存分类统计</h2>
          <div className="space-y-4">
            {Object.entries(inventoryByCategory).map(([category, count]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{category}</span>
                  <span className="text-sm font-medium text-gray-900">{count} 种</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${(count / inventoryItems.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">场次状态分布</h2>
          <div className="space-y-4">
            {Object.entries(screeningByStatus).map(([status, count]) => {
              const labels: Record<string, string> = {
                normal: '正常',
                hall_changed: '已换厅',
                equipment_failure: '设备故障',
                refund_issue: '退票问题',
                completed: '已完成',
              }
              const colors: Record<string, string> = {
                normal: 'bg-success-500',
                hall_changed: 'bg-warning-500',
                equipment_failure: 'bg-danger-500',
                refund_issue: 'bg-warning-500',
                completed: 'bg-gray-400',
              }
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{labels[status] || status}</span>
                    <span className="text-sm font-medium text-gray-900">{count} 场</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${colors[status] || 'bg-gray-400'} h-2 rounded-full`}
                      style={{ width: `${(count / screenings.length) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">运营效率指标</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {todos.length > 0 ? `${Math.round((completedTodos / todos.length) * 100)}%` : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">待办完成率</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <BarChart3 className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {exceptions.length > 0 ? `${Math.round((resolvedExceptions / exceptions.length) * 100)}%` : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">异常解决率</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <DollarSign className="w-8 h-8 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalTickets > 0 ? `${((1 - totalRefunds / totalTickets) * 100).toFixed(1)}%` : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">票务成功率</p>
          </div>
        </div>
      </div>
    </div>
  )
}
