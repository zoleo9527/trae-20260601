import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import type { MealType, Order } from '@/types'
import { MEAL_TYPE_LABELS } from '@/types'
import { CheckSquare, Square } from 'lucide-react'
import OrderCard from './OrderCard'

function groupByMealType(orders: Order[]): Record<MealType, Order[]> {
  const grouped: Record<MealType, Order[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
  }
  for (const order of orders) {
    grouped[order.mealType].push(order)
  }
  return grouped
}

const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner']

export default function OrderList() {
  const { getFilteredOrders, viewMode, selectAllOrders, clearSelection, selectedOrderIds } =
    useOrderStore()
  const orders = getFilteredOrders()
  const grouped = groupByMealType(orders)
  const allSelectable = orders.filter((o) => o.status === 'served' || o.status === 'pending')
  const allSelected = allSelectable.length > 0 && allSelectable.every((o) => selectedOrderIds.has(o.id))

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-stone-700">
          {viewMode === 'today' && '今日订单'}
          {viewMode === 'tomorrow' && '明日订单'}
          {viewMode === 'abnormal' && '异常订单'}
          <span className="ml-2 text-sm font-normal text-stone-400">{orders.length} 条</span>
        </h2>
        <button
          onClick={allSelected ? clearSelection : selectAllOrders}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
            allSelected
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          )}
        >
          {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          {allSelected ? '取消全选' : '全选可核销'}
        </button>
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <p className="text-sm">暂无订单</p>
        </div>
      )}

      {mealOrder.map((meal) => {
        const mealOrders = grouped[meal]
        if (mealOrders.length === 0) return null
        return (
          <div key={meal} className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded',
                  meal === 'breakfast' && 'bg-amber-100 text-amber-700',
                  meal === 'lunch' && 'bg-orange-100 text-orange-700',
                  meal === 'dinner' && 'bg-indigo-100 text-indigo-700'
                )}
              >
                {MEAL_TYPE_LABELS[meal]}
              </span>
              <span className="text-xs text-stone-400">{mealOrders.length} 份</span>
            </div>
            <div className="space-y-2">
              {mealOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
