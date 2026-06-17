'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import {
  ScanLine,
  Package,
  Minus,
  Plus,
  Camera,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

interface DepositItem {
  id: string
  itemName: string
  category: string
  remaining: number
  quantity: number
}

interface Deposit {
  id: string
  depositCode: string
  customerName: string
  status: string
  items: DepositItem[]
}

export default function RedeemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCode = searchParams.get('deposit') || ''

  const [depositCode, setDepositCode] = useState(initialCode)
  const [deposit, setDeposit] = useState<Deposit | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialCode) {
      handleSearch()
    }
  }, [])

  const handleSearch = async () => {
    if (!depositCode) return

    setSearching(true)
    setError('')

    const response = await fetch(`/api/deposit/search?code=${encodeURIComponent(depositCode)}`)
    const result = await response.json()

    if (result.success) {
      setDeposit(result.data)
      setSelectedItems({})
    } else {
      setDeposit(null)
      setError(result.error || '寄存记录不存在')
    }
    setSearching(false)
  }

  const updateQuantity = (itemName: string, delta: number) => {
    const item = deposit?.items.find((i) => i.itemName === itemName)
    if (!item) return

    const current = selectedItems[itemName] || 0
    const newQuantity = Math.max(0, Math.min(item.remaining, current + delta))

    setSelectedItems({
      ...selectedItems,
      [itemName]: newQuantity,
    })
  }

  const totalItems = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0)

  const handleSubmit = async () => {
    if (totalItems === 0 || !deposit) return

    setLoading(true)

    const redeemItems = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemName, quantity]) => ({ itemName, quantity }))

    const response = await fetch('/api/redeem/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        depositId: deposit.id,
        depositCode: deposit.depositCode,
        items: redeemItems,
        operator: 'admin',
        notes,
      }),
    })

    const result = await response.json()

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/redeem/history')
      }, 2000)
    } else {
      setError(result.error || '核销失败')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#4ECDC4]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-[#4ECDC4]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">核销成功</h2>
          <p className="text-[#A0AEC0]">正在跳转至核销历史...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="取用核销" subtitle="为客户办理酒水取用核销" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 寄存编号输入 */}
          <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="w-5 h-5 text-[#00D9FF]" />
              <h3 className="text-lg font-bold text-white">查找寄存</h3>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                value={depositCode}
                onChange={(e) => setDepositCode(e.target.value)}
                placeholder="输入寄存编号或扫描二维码..."
                className="flex-1 px-4 py-3 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all text-lg font-mono"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20 disabled:opacity-50"
              >
                {searching ? '查找中...' : '查找'}
              </button>
              <button className="px-6 py-3 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
                <ScanLine className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <p className="mt-4 text-[#FF6B6B] text-sm">{error}</p>
            )}
          </div>

          {/* 寄存详情 */}
          {deposit && (
            <>
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-[#00D9FF]" />
                    <div>
                      <p className="text-sm font-mono text-[#00D9FF]">{deposit.depositCode}</p>
                      <p className="text-sm text-[#A0AEC0]">客户：{deposit.customerName}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      deposit.status === 'ACTIVE' || deposit.status === 'PARTIALLY'
                        ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]'
                        : deposit.status === 'COMPLETED'
                        ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]'
                        : 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]'
                    }`}
                  >
                    {deposit.status === 'ACTIVE' ? '进行中' : deposit.status === 'PARTIALLY' ? '部分取完' : deposit.status === 'COMPLETED' ? '已完成' : '已过期'}
                  </span>
                </div>

                {/* 物品选择 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white">选择要核销的酒水：</h4>
                  {deposit.items.map((item) => {
                    const quantity = selectedItems[item.itemName] || 0
                    const isSelected = quantity > 0

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'bg-[#00D9FF]/10 border-[#00D9FF]'
                            : 'bg-[#0D1117] border-[#2D3748]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-white">{item.itemName}</p>
                            <p className="text-xs text-[#A0AEC0]">
                              {item.category} · 剩余 {item.remaining}/{item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.itemName, -1)}
                              disabled={quantity === 0}
                              className="p-2 rounded-lg bg-[#1A1F2E] border border-[#2D3748] hover:bg-[#252B3B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4 text-[#A0AEC0]" />
                            </button>
                            <span className="w-12 text-center text-lg font-mono text-white">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.itemName, 1)}
                              disabled={quantity >= item.remaining}
                              className="p-2 rounded-lg bg-[#1A1F2E] border border-[#2D3748] hover:bg-[#252B3B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4 text-[#A0AEC0]" />
                            </button>
                          </div>
                        </div>
                        <div className="w-full bg-[#2D3748] rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#00D9FF] to-[#4ECDC4] h-2 rounded-full transition-all"
                            style={{ width: `${(quantity / item.remaining) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 备注和拍照 */}
              <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                      备注信息
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] transition-all resize-none"
                      placeholder="可选：添加备注信息..."
                    />
                  </div>

                  <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
                    <Camera className="w-5 h-5" />
                    拍照留存（可选）
                  </button>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#A0AEC0]">
                  已选择 <span className="text-[#00D9FF] font-bold">{totalItems}</span> 件物品
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={totalItems === 0 || loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? '核销中...' : '确认核销'}
                </button>
              </div>
            </>
          )}

          {!deposit && !searching && !initialCode && (
            <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-[#A0AEC0] mx-auto mb-4" />
              <p className="text-[#A0AEC0]">请输入寄存编号查找寄存记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}