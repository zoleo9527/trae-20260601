import { useState } from 'react'
import { Filter, Search, AlertCircle, Clock, CheckCircle, XCircle, FileWarning } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PurchaseCard } from './PurchaseCard'
import { PurchaseStatus } from '../types'
import { cn } from '../utils'

const statusFilters: { value: PurchaseStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: null },
  { value: 'pending_acceptance', label: '待验收', icon: <Clock className="w-4 h-4" /> },
  { value: 'sample_pending', label: '待留样', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'supplementing', label: '补充中', icon: <FileWarning className="w-4 h-4" /> },
  { value: 'dispute', label: '有争议', icon: <XCircle className="w-4 h-4" /> },
  { value: 'overdue', label: '已逾期', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'sample_completed', label: '已完成', icon: <CheckCircle className="w-4 h-4" /> },
]

export function PurchaseList() {
  const { getFilteredPurchases, currentUser } = useStore()
  const [activeFilter, setActiveFilter] = useState<PurchaseStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const purchases = getFilteredPurchases()

  const filteredPurchases = purchases.filter((p) => {
    const matchesStatus = activeFilter === 'all' || p.status === activeFilter
    const matchesSearch = 
      p.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status === 'pending_acceptance' || p.status === 'sample_pending').length,
    exception: purchases.filter(p => p.status === 'supplementing' || p.status === 'dispute' || p.status === 'overdue').length,
    completed: purchases.filter(p => p.status === 'sample_completed').length,
  }

  const needsMyAction = purchases.filter(p => 
    p.currentHandlerId === currentUser.id ||
    (p.status === 'pending_acceptance' && currentUser.role === 'admin') ||
    (p.status === 'sample_pending' && currentUser.role === 'admin') ||
    (p.status === 'supplementing' && currentUser.role === 'purchaser')
  ).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">全部采购单</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">待我处理</div>
          <div className="text-2xl font-bold text-primary-600">{needsMyAction}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">异常/争议</div>
          <div className="text-2xl font-bold text-orange-600">{stats.exception}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 mb-1">已完成</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">状态筛选</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、供应商、菜品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-72 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeFilter === filter.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">没有找到符合条件的采购单</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPurchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  )
}
