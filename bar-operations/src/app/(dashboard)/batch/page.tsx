'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Layers, Package, Clock, CheckCircle, Download, RefreshCw } from 'lucide-react'

interface BatchItem {
  id: string
  depositCode: string
  customerName: string
  itemName: string
  quantity: number
  remaining: number
  expiredAt: string
  type: 'redeem' | 'extend'
  selected: boolean
}

export default function BatchPage() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [actionType, setActionType] = useState<'redeem' | 'extend'>('redeem')
  const [extendDays, setExtendDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchItems = async () => {
    setRefreshing(true)
    const response = await fetch('/api/deposit/list')
    const result = await response.json()

    if (result.success) {
      const today = new Date().toISOString().slice(0, 10)
      const batchItems: BatchItem[] = result.data
        .filter((d: any) => d.status !== 'COMPLETED')
        .map((deposit: any) => ({
          id: deposit.id,
          depositCode: deposit.depositCode,
          customerName: deposit.customerName,
          itemName: deposit.items[0]?.itemName || '',
          quantity: deposit.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          remaining: deposit.items.reduce((sum: number, item: any) => sum + item.remaining, 0),
          expiredAt: deposit.expiredAt,
          type: deposit.expiredAt < today ? 'extend' : 'redeem',
          selected: false,
        }))
      setItems(batchItems)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    )
  }

  const toggleAll = () => {
    const allSelected = items.every((item) => item.selected)
    setItems(items.map((item) => ({ ...item, selected: !allSelected })))
  }

  const selectedCount = items.filter((item) => item.selected).length

  const handleBatchAction = async () => {
    if (selectedCount === 0) return

    setLoading(true)
    const selectedIds = items.filter((item) => item.selected).map((item) => item.id)

    let url = ''
    let body = {}

    if (actionType === 'redeem') {
      url = '/api/batch/redeem'
      body = { depositIds: selectedIds, operator: 'admin' }
    } else {
      url = '/api/batch/extend'
      body = { depositIds: selectedIds, days: extendDays, operator: 'admin' }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (result.success) {
      alert(`${actionType === 'redeem' ? '批量核销' : '批量延期'}成功！共处理 ${result.data.count} 条记录`)
      fetchItems()
    } else {
      alert(result.error || '操作失败')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Header title="批量处理" subtitle="批量核销、延期和导出操作" />

      <div className="p-8 space-y-6">
        {/* 操作类型选择 */}
        <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#00D9FF]" />
            <h3 className="text-lg font-bold text-white">批量操作</h3>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActionType('redeem')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                actionType === 'redeem'
                  ? 'bg-[#00D9FF]/10 border-[#00D9FF] text-[#00D9FF]'
                  : 'bg-[#0D1117] border-[#2D3748] text-[#A0AEC0] hover:border-[#00D9FF]'
              }`}
            >
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">批量核销</p>
            </button>
            <button
              onClick={() => setActionType('extend')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                actionType === 'extend'
                  ? 'bg-[#F5A623]/10 border-[#F5A623] text-[#F5A623]'
                  : 'bg-[#0D1117] border-[#2D3748] text-[#A0AEC0] hover:border-[#F5A623]'
              }`}
            >
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">批量延期</p>
            </button>
          </div>

          {actionType === 'extend' && (
            <div>
              <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                延期天数
              </label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white focus:outline-none focus:border-[#F5A623] transition-all"
              />
            </div>
          )}
        </div>

        {/* 待处理列表 */}
        <div className="bg-[#1A1F2E] rounded-lg border border-[#2D3748] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">待处理列表</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchAction}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={toggleAll}
                className="text-sm text-[#00D9FF] hover:bg-[#00D9FF]/10 px-3 py-1 rounded transition-colors"
              >
                {items.every((item) => item.selected) ? '取消全选' : '全选'}
              </button>
              <span className="text-sm text-[#A0AEC0]">
                已选择 <span className="text-[#00D9FF] font-bold">{selectedCount}</span> 项
              </span>
            </div>
          </div>

          {refreshing ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#A0AEC0]">加载中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    item.selected
                      ? 'bg-[#00D9FF]/10 border-[#00D9FF]'
                      : 'bg-[#0D1117] border-[#2D3748] hover:border-[#00D9FF]/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        item.selected
                          ? 'bg-[#00D9FF] border-[#00D9FF]'
                          : 'border-[#2D3748]'
                      }`}
                    >
                      {item.selected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-[#00D9FF]">{item.depositCode}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          item.type === 'extend' 
                            ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]' 
                            : 'bg-[#F5A623]/20 text-[#F5A623]'
                        }`}>
                          {item.type === 'extend' ? '已过期' : '待核销'}
                        </span>
                      </div>
                      <p className="text-sm text-white mb-1">
                        {item.customerName} · {item.itemName} × {item.remaining}/{item.quantity}
                      </p>
                      <p className="text-xs text-[#A0AEC0]">
                        有效期至：{item.expiredAt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 执行按钮 */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1F2E] border border-[#2D3748] text-[#A0AEC0] rounded-lg hover:bg-[#252B3B] transition-colors">
            <Download className="w-5 h-5" />
            导出选中项
          </button>
          <button
            onClick={handleBatchAction}
            disabled={selectedCount === 0 || loading}
            className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'redeem'
                ? 'bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white hover:from-[#00B8D9] hover:to-[#0099CC] shadow-[#00D9FF]/20'
                : 'bg-gradient-to-r from-[#F5A623] to-[#E09000] text-white hover:from-[#E09000] hover:to-[#CC8000] shadow-[#F5A623]/20'
            }`}
          >
            {loading ? '处理中...' : `${actionType === 'redeem' ? '批量核销' : '批量延期'} (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}