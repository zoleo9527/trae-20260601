import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { useOrdersStore } from '@/stores/orders'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import type { OrderItem } from '@/shared/types'

interface OrderItemForm {
  productName: string
  specification: string
  quantity: number
  unit: string
}

export default function NewOrder() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createOrder, isLoading } = useOrdersStore()

  const [distributorName, setDistributorName] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [remark, setRemark] = useState('')
  const [items, setItems] = useState<OrderItemForm[]>([
    { productName: '', specification: '', quantity: 1, unit: '箱' }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user && user.role !== 'SALES') {
      navigate('/orders')
    }
  }, [user, navigate])

  const addItem = () => {
    setItems([...items, { productName: '', specification: '', quantity: 1, unit: '箱' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!distributorName.trim()) {
      newErrors.distributorName = '请输入经销商名称'
    }

    if (!deliveryDate) {
      newErrors.deliveryDate = '请选择交货日期'
    }

    const validItems = items.filter(item => item.productName.trim())
    if (validItems.length === 0) {
      newErrors.items = '请至少添加一个产品'
    }

    items.forEach((item, index) => {
      if (item.productName.trim() && item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = '数量必须大于0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const validItems = items.filter(item => item.productName.trim())

    try {
      const newOrder = await createOrder({
        distributorName,
        deliveryDate,
        remark: remark || null,
        items: validItems as unknown as OrderItem[],
      })
      navigate(`/orders/${newOrder.id}`)
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const handleCancel = () => {
    navigate('/orders')
  }

  if (user && user.role !== 'SALES') {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 rounded-md hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/orders" className="text-stone-500 hover:text-stone-700">
              订单列表
            </Link>
            <span className="text-stone-400">/</span>
            <span className="text-stone-900 font-medium">新建订单</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
          <h1 className="text-xl font-semibold text-stone-900 mb-6">新建订单</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  经销商名称
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={distributorName}
                  onChange={(e) => setDistributorName(e.target.value)}
                  placeholder="请输入经销商名称"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                    errors.distributorName ? 'border-red-500' : 'border-stone-300'
                  )}
                />
                {errors.distributorName && (
                  <p className="text-sm text-red-500 mt-1">{errors.distributorName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  交货日期
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                    errors.deliveryDate ? 'border-red-500' : 'border-stone-300'
                  )}
                />
                {errors.deliveryDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.deliveryDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                备注
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="请输入备注信息（可选）"
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-stone-700">
                  产品明细
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  添加产品
                </button>
              </div>

              {errors.items && (
                <p className="text-sm text-red-500 mb-3">{errors.items}</p>
              )}

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end p-3 bg-stone-50 rounded-lg"
                  >
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-stone-500 mb-1">
                        产品名称
                      </label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        placeholder="请输入产品名称"
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-stone-500 mb-1">
                        规格
                      </label>
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                        placeholder="规格"
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-stone-500 mb-1">
                        数量
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm',
                          errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-stone-300'
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-stone-500 mb-1">
                        单位
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      >
                        <option value="箱">箱</option>
                        <option value="瓶">瓶</option>
                        <option value="罐">罐</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        className="p-2 text-stone-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                提交订单
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
