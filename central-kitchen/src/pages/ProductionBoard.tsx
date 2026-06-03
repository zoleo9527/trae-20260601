import { useState } from 'react'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  ChefHat,
  Truck,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { StatusBadge } from '@/components/StatusBadge'
import { useNavigate } from 'react-router-dom'

export function ProductionBoard() {
  const navigate = useNavigate()
  const { orders } = useMealOrderStore()
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const todaysOrders = orders.filter((o) => o.deliveryDate === selectedDate)

  const columns = [
    {
      id: 'pending',
      title: '待生产',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      statuses: ['draft', 'submitted', 'production_review'],
    },
    {
      id: 'producing',
      title: '生产中',
      icon: ChefHat,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      statuses: ['production_approved'],
    },
    {
      id: 'distributed',
      title: '配送中',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      statuses: ['distributed'],
    },
    {
      id: 'completed',
      title: '已完成',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      statuses: ['received', 'shortage_reported'],
    },
    {
      id: 'rejected',
      title: '已驳回',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      statuses: ['production_rejected'],
    },
  ]

  const getOrdersForColumn = (statuses: string[]) =>
    todaysOrders.filter((o) => statuses.includes(o.status))

  const totalQuantity = todaysOrders.reduce(
    (sum, o) => sum + o.totalQuantity,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">生产白板</h2>
          <p className="text-sm text-neutral-500 mt-1">
            查看今日生产进度，一目了然各配餐单状态
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            className="input w-40"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="text-sm text-neutral-500">
            今日总计：
            <span className="font-bold text-primary-600 mx-1">
              {todaysOrders.length}
            </span>
            单，
            <span className="font-bold text-primary-600 mx-1">
              {totalQuantity}
            </span>
            份
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-240px)]">
        {columns.map((column) => {
          const Icon = column.icon
          const columnOrders = getOrdersForColumn(column.statuses)

          return (
            <div
              key={column.id}
              className={`flex flex-col rounded-xl border ${column.bgColor} ${column.borderColor}`}
            >
              <div className="px-4 py-3 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${column.color}`} />
                    <span className="font-semibold text-neutral-900">
                      {column.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${column.bgColor} ${column.color}`}
                  >
                    {columnOrders.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {columnOrders.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-sm">
                    暂无订单
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/meal-orders/${order.id}`)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {order.orderNo}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-neutral-600 mb-2">
                        <Package className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
                        {order.storeName}
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>
                          {order.items.length} 种菜品
                        </span>
                        <span className="font-medium text-primary-600">
                          {order.totalQuantity} 份
                        </span>
                      </div>
                      {order.shortageReplenish && (
                        <div className="mt-2 pt-2 border-t border-dashed border-neutral-200">
                          <span className="text-xs text-danger-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            存在缺货
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-body">
          <h4 className="font-medium text-neutral-900 mb-4">今日生产统计</h4>
          <div className="grid grid-cols-6 gap-4">
            {columns.map((column) => {
              const Icon = column.icon
              const count = getOrdersForColumn(column.statuses).length
              const qty = getOrdersForColumn(column.statuses).reduce(
                (sum, o) => sum + o.totalQuantity,
                0
              )

              return (
                <div
                  key={column.id}
                  className={`rounded-lg p-4 ${column.bgColor} border ${column.borderColor}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${column.color}`} />
                    <span className="text-sm font-medium text-neutral-700">
                      {column.title}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {count}
                    <span className="text-sm font-normal text-neutral-500 ml-1">
                      单
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {qty}
                    <span className="text-xs text-neutral-400 ml-1">份</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
