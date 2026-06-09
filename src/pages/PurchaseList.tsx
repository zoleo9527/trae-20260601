import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Plus, Calendar, User, ChevronDown, ChevronUp, X } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PurchaseBadge, QualificationBadge } from '@/components/StatusBadge'
import CreatePurchaseModal from '@/components/CreatePurchaseModal'
import { useStore } from '@/store'
import type { Purchase, PurchaseStatus, PaginatedResponse } from '@/types'

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'rejected', label: '已驳回' },
  { value: 'confirmed_out', label: '已出库' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
]

const stripeColors: Record<PurchaseStatus, string> = {
  draft: 'bg-gray-300',
  pending_review: 'bg-blue-400',
  approved: 'bg-green-400',
  rejected: 'bg-red-400',
  confirmed_out: 'bg-teal-400',
  shipped: 'bg-indigo-400',
  completed: 'bg-emerald-400',
}

function formatAmount(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PurchaseList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useStore()
  const [status, setStatus] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedResponse<Purchase>>({ list: [], total: 0, page: 1, page_size: 10 })
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const totalPages = Math.ceil(data.total / data.page_size)

  useEffect(() => {
    if (location.state?.showCreate) {
      setShowCreate(true)
      navigate(location.pathname, { state: {}, replace: true })
    }
  }, [location.state])

  const fetchData = async (p = page) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(p), page_size: '10' }
      if (status) params.status = status
      if (customerName) params.customer_name = customerName
      if (createdBy) params.created_by = createdBy
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const res = await apiGet<PaginatedResponse<Purchase>>('/purchases', params)
      setData(res)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData(1)
  }

  const handleReset = () => {
    setStatus('')
    setCustomerName('')
    setCreatedBy('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = status || customerName || createdBy || dateFrom || dateTo

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索客户名称"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors',
              showAdvanced ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50',
            )}
          >
            更多筛选
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button onClick={handleSearch} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
            搜索
          </button>
          {session?.role === 'sales_clerk' && (
            <button
              onClick={() => setShowCreate(true)}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              新建采购申请
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="申请人"
                className="rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>创建日期</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
              />
              <span>~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
              />
            </div>
            {hasFilters && (
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />清除筛选
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">加载中...</div>
      ) : data.list.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">暂无采购申请</div>
      ) : (
        <div className="space-y-3">
          {data.list.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/purchases/${p.id}`)}
              className="flex cursor-pointer items-stretch overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
            >
              <div className={cn('w-1 shrink-0', stripeColors[p.status])} />
              <div className="flex flex-1 items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{p.request_no}</span>
                    <span className="text-gray-600">{p.customer_name}</span>
                    <QualificationBadge status={p.qualification_status} className="px-1.5 py-px text-[10px]" />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{p.created_by}</span>
                    <span>{p.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                <PurchaseBadge status={p.status} />
                <span className="text-sm font-semibold text-gray-900">{formatAmount(p.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      {showCreate && <CreatePurchaseModal onClose={() => setShowCreate(false)} onCreated={() => fetchData()} />}
    </div>
  )
}
