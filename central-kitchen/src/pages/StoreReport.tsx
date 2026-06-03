import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus,
} from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { DenseTable } from '@/components/DenseTable'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/Button'
import { STORES } from '@/data/mockData'

export function StoreReport() {
  const navigate = useNavigate()
  const { orders } = useMealOrderStore()
  const [selectedStore, setSelectedStore] = useState('')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const filteredOrders = orders.filter((order) => {
    const matchesStore = !selectedStore || order.storeId === selectedStore
    const matchesDate =
      order.deliveryDate >= startDate && order.deliveryDate <= endDate
    return matchesStore && matchesDate
  })

  const stats = {
    total: filteredOrders.length,
    completed: filteredOrders.filter((o) => o.status === 'received').length,
    shortage: filteredOrders.filter((o) => o.shortageReplenish).length,
    totalQty: filteredOrders.reduce((sum, o) => sum + o.totalQuantity, 0),
  }

  const storeStats = STORES.map((store) => {
    const storeOrders = filteredOrders.filter((o) => o.storeId === store.id)
    return {
      ...store,
      orderCount: storeOrders.length,
      totalQty: storeOrders.reduce((sum, o) => sum + o.totalQuantity, 0),
      shortageCount: storeOrders.filter((o) => o.shortageReplenish).length,
      completedCount: storeOrders.filter((o) => o.status === 'received').length,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">门店报量</h2>
          <p className="text-sm text-neutral-500 mt-1">
            查看各门店的报量情况和历史数据
          </p>
        </div>
        <Button onClick={() => navigate('/meal-orders/create')}>
          <Plus className="w-4 h-4 mr-2" />
          新建报量
        </Button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label">门店</label>
              <select
                className="input w-40"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="">全部门店</option>
                {STORES.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                className="input w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                className="input w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">报量单数</p>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">已完成</p>
              <p className="text-2xl font-bold text-success-600">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">缺货次数</p>
              <p className="text-2xl font-bold text-danger-600">
                {stats.shortage}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">总份数</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.totalQty}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-neutral-900">各门店汇总</h3>
        </div>
        <div className="card-body p-0">
          <DenseTable
            columns={[
              { key: 'name', title: '门店' },
              { key: 'contact', title: '联系人' },
              { key: 'phone', title: '联系电话' },
              {
                key: 'orderCount',
                title: '报量单数',
                align: 'right',
                render: (row: any) => (
                  <span className="font-medium">{row.orderCount}</span>
                ),
              },
              {
                key: 'totalQty',
                title: '总份数',
                align: 'right',
                render: (row: any) => (
                  <span className="font-medium text-primary-600">
                    {row.totalQty}
                  </span>
                ),
              },
              {
                key: 'completedCount',
                title: '已完成',
                align: 'right',
                render: (row: any) => (
                  <span className="text-success-600">{row.completedCount}</span>
                ),
              },
              {
                key: 'shortageCount',
                title: '缺货次数',
                align: 'right',
                render: (row: any) =>
                  row.shortageCount > 0 ? (
                    <span className="text-danger-600 font-medium">
                      {row.shortageCount}
                    </span>
                  ) : (
                    <span className="text-neutral-400">0</span>
                  ),
              },
              {
                key: 'shortageRate',
                title: '缺货率',
                align: 'right',
                render: (row: any) => {
                  const rate =
                    row.orderCount > 0
                      ? (row.shortageCount / row.orderCount) * 100
                      : 0
                  return (
                    <span
                      className={
                        rate > 20
                          ? 'text-danger-600 font-medium'
                          : rate > 10
                          ? 'text-amber-600'
                          : 'text-neutral-600'
                      }
                    >
                      {rate.toFixed(1)}%
                    </span>
                  )
                },
              },
            ]}
            data={storeStats}
            rowKey="id"
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-neutral-900">报量明细</h3>
        </div>
        <div className="card-body p-0">
          <DenseTable
            columns={[
              { key: 'orderNo', title: '单号', width: '140px' },
              { key: 'storeName', title: '门店' },
              { key: 'deliveryDate', title: '配送日期', width: '120px' },
              {
                key: 'totalQuantity',
                title: '数量',
                align: 'right',
                width: '100px',
              },
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
          />
        </div>
      </div>
    </div>
  )
}
