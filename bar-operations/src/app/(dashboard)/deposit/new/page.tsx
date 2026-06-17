'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Plus, Minus, Trash2, Package, Save, ArrowLeft } from 'lucide-react'

interface DepositItem {
  id: string
  itemName: string
  category: string
  quantity: number
}

const categories = ['威士忌', '啤酒', '红酒', '白酒', '其他']

export default function NewDepositPage() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [expiryDays, setExpiryDays] = useState(30)
  const [items, setItems] = useState<DepositItem[]>([
    { id: '1', itemName: '', category: '威士忌', quantity: 1 },
  ])
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        itemName: '',
        category: categories[0],
        quantity: 1,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof DepositItem, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production, make actual API call
    console.log({
      customerName,
      customerPhone,
      bookingId,
      expiryDays,
      items,
    })

    router.push('/deposit')
  }

  return (
    <div className="min-h-screen">
      <Header title="新建寄存" subtitle="为客户创建新的酒水寄存" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-[#00D9FF]" />
                <h3 className="text-lg font-bold text-white">基本信息</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                    客户姓名 <span className="text-[#FF6B6B]">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
                    placeholder="请输入客户姓名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                    客户电话
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
                    placeholder="请输入客户电话"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                    关联订台编号
                  </label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
                    placeholder="如有订台，请输入订台编号"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                    有效期（天）
                  </label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 寄存物品 */}
            <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#00D9FF]" />
                  <h3 className="text-lg font-bold text-white">寄存物品</h3>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00D9FF]/20 text-[#00D9FF] rounded-lg hover:bg-[#00D9FF]/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加物品
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0D1117] rounded-lg border border-[#2D3748]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                          物品名称
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          className="w-full px-3 py-2 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all"
                          placeholder="例如：尊尼获加"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                          品类
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#00D9FF] transition-all"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                          数量
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                            className="p-2 bg-[#1A1F2E] border border-[#2D3748] rounded-lg hover:bg-[#252B3B] transition-colors"
                          >
                            <Minus className="w-4 h-4 text-[#A0AEC0]" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="flex-1 px-3 py-2 bg-[#1A1F2E] border border-[#2D3748] rounded-lg text-white text-center focus:outline-none focus:border-[#00D9FF] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                            className="p-2 bg-[#1A1F2E] border border-[#2D3748] rounded-lg hover:bg-[#252B3B] transition-colors"
                          >
                            <Plus className="w-4 h-4 text-[#A0AEC0]" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2.5 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded-lg hover:bg-[#FF6B6B]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/deposit"
                className="px-6 py-2.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={loading || !customerName || items.some((item) => !item.itemName)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? '保存中...' : '保存寄存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
