import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { useMealOrderStore } from '@/store/mealOrderStore'
import { useAuthStore } from '@/store/authStore'
import { STORES, MEAL_ITEMS_TEMPLATE } from '@/data/mockData'
import { DenseTable } from '@/components/DenseTable'
import { Button } from '@/components/Button'
import type { MealItem, MealOrder } from '@/types'

export function MealOrderCreate() {
  const navigate = useNavigate()
  const { createOrder } = useMealOrderStore()
  const { currentUser } = useAuthStore()

  const [storeId, setStoreId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [items, setItems] = useState<MealItem[]>(
    MEAL_ITEMS_TEMPLATE.map((item) => ({
      ...item,
      id: Math.random().toString(36).substring(2, 11),
    }))
  )

  const selectedStore = STORES.find((s) => s.id === storeId)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const generateOrderNo = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `MO-${date}-${random}`
  }

  const handleSave = (submit: boolean = false) => {
    if (!storeId) {
      alert('请选择门店')
      return
    }
    if (totalQuantity === 0) {
      alert('请至少填写一个菜品的数量')
      return
    }

    const order: Omit<MealOrder, 'id'> = {
      orderNo: generateOrderNo(),
      storeId,
      storeName: selectedStore!.name,
      deliveryDate,
      items: items.filter((i) => i.quantity > 0),
      status: submit ? 'submitted' : 'draft',
      totalQuantity,
      statusLogs: [
        {
          id: Math.random().toString(36).substring(2, 11),
          status: submit ? 'submitted' : 'draft',
          operator: currentUser!.name,
          operatorRole: currentUser!.role,
          timestamp: new Date().toISOString(),
          remark: submit ? '提交配餐单' : '创建配餐单草稿',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser!.name,
    }

    createOrder(order)
    navigate('/meal-orders')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/meal-orders')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">新建配餐单</h2>
          <p className="text-sm text-neutral-500 mt-1">
            创建新的门店配餐订单
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">基本信息</h3>
            </div>
            <div className="card-body grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  门店 <span className="text-danger-500">*</span>
                </label>
                <select
                  className="input"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  <option value="">请选择门店</option>
                  {STORES.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  配送日期 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              {selectedStore && (
                <>
                  <div>
                    <label className="label text-neutral-500">联系人</label>
                    <div className="input bg-neutral-50">
                      {selectedStore.contact}
                    </div>
                  </div>
                  <div>
                    <label className="label text-neutral-500">联系电话</label>
                    <div className="input bg-neutral-50">
                      {selectedStore.phone}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label text-neutral-500">门店地址</label>
                    <div className="input bg-neutral-50">
                      {selectedStore.address}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">配餐明细</h3>
              <div className="text-sm text-neutral-500">
                总计：<span className="font-bold text-primary-600">{totalQuantity}</span> 份
              </div>
            </div>
            <div className="card-body p-0">
              <DenseTable
                columns={[
                  { key: 'name', title: '菜品名称', width: '180px' },
                  { key: 'unit', title: '单位', width: '60px', align: 'center' },
                  {
                    key: 'quantity',
                    title: '数量',
                    width: '150px',
                    render: (row: any) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateItemQuantity(
                              row.id,
                              Math.max(0, row.quantity - 1)
                            )
                          }
                          className="w-7 h-7 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="input input-sm w-16 text-center"
                          value={row.quantity}
                          min={0}
                          onChange={(e) =>
                            updateItemQuantity(
                              row.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                        <button
                          onClick={() =>
                            updateItemQuantity(row.id, row.quantity + 1)
                          }
                          className="w-7 h-7 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
                        >
                          +
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={items}
                rowKey="id"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-primary-50 border-primary-200">
            <div className="card-body">
              <h4 className="font-semibold text-primary-700 mb-3">配餐汇总</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-primary-600">菜品种类</span>
                  <span className="font-bold text-primary-700">
                    {items.filter((i) => i.quantity > 0).length} 种
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-600">总数量</span>
                  <span className="font-bold text-primary-700">
                    {totalQuantity} 份
                  </span>
                </div>
                <div className="border-t border-primary-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-primary-600">门店</span>
                    <span className="font-medium text-primary-700">
                      {selectedStore?.name || '未选择'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">快捷操作</h3>
            </div>
            <div className="card-body space-y-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() =>
                  setItems(
                    MEAL_ITEMS_TEMPLATE.map((item) => ({
                      ...item,
                      id: Math.random().toString(36).substring(2, 11),
                      quantity: Math.floor(Math.random() * 30) + 10,
                    }))
                  )
                }
              >
                随机填充数量
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() =>
                  setItems(
                    MEAL_ITEMS_TEMPLATE.map((item) => ({
                      ...item,
                      id: Math.random().toString(36).substring(2, 11),
                    }))
                  )
                }
              >
                清空所有数量
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleSave(false)}
            >
              <Save className="w-4 h-4 mr-2" />
              保存草稿
            </Button>
            <Button
              fullWidth
              onClick={() => handleSave(true)}
              disabled={!storeId || totalQuantity === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              提交配餐单
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
