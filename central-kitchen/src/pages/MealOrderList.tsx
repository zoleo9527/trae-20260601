import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/StatusBadge'
import { DenseTable } from '@/components/DenseTable'
import { Button } from '@/components/Button'
import {
  MEAL_ORDER_STATUS_LABELS,
} from '@/constants/statusMachine'
import type { MealOrderStatus } from '@/types'

export function MealOrderList() {
  const navigate = useNavigate()
  const { orders } = useMealOrderStore()
  const { hasPermission } = useAuthStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<MealOrderStatus | 'all'>('all')

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchText.toLowerCase()) ||
      order.storeName.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions: { value: MealOrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(MEAL_ORDER_STATUS_LABELS).map(([value, label]) => ({
      value: value as MealOrderStatus,
      label,
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">门店配餐</h2>
          <p className="text-sm text-neutral-500 mt-1">
            管理所有门店的配餐订单
          </p>
        </div>
        {hasPermission('create_order') && (
          <Button onClick={() => navigate('/meal-orders/create')}>
            <Plus className="w-4 h-4 mr-2" />
            新建配餐单
          </Button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                className="input pl-10"
                placeholder="搜索单号、门店名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                className="input w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DenseTable
            columns={[
              { key: 'orderNo', title: '配餐单号', width: '140px' },
              { key: 'storeName', title: '门店' },
              { key: 'deliveryDate', title: '配送日期', width: '120px' },
              { key: 'totalQuantity', title: '总数量', align: 'right', width: '100px' },
              {
                key: 'itemCount',
                title: '菜品数',
                align: 'right',
                width: '80px',
                render: (row: any) => row.items.length,
              },
              {
                key: 'status',
                title: '状态',
                width: '120px',
                render: (row: any) => <StatusBadge status={row.status} />,
              },
              {
                key: 'hasShortage',
                title: '缺货',
                width: '80px',
                align: 'center',
                render: (row: any) =>
                  row.shortageReplenish ? (
                    <span className="text-danger-600 text-xs font-medium">
                      是
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-xs">-</span>
                  ),
              },
              {
                key: 'createdAt',
                title: '创建时间',
                width: '160px',
                render: (row: any) =>
                  new Date(row.createdAt).toLocaleString('zh-CN'),
              },
              {
                key: 'action',
                title: '操作',
                width: '80px',
                render: (row: any) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/meal-orders/${row.id}`)
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    查看
                  </button>
                ),
              },
            ]}
            data={filteredOrders}
            rowKey="id"
            onRowClick={(row: any) => navigate(`/meal-orders/${row.id}`)}
            emptyText="暂无配餐单"
          />
        </div>
      </div>
    </div>
  )
}
