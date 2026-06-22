import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/Card'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { MessageSquareQuote, Filter, ChevronDown, Eye, X } from 'lucide-react'
import {
  formatCurrency,
  formatDateTime,
  quoteStatusLabels,
  quoteStatusColors,
  adjustmentTypeLabels,
  adjustmentTypeColors,
} from '@/lib/format'
import type { CustomerQuote, QuoteStatus } from '@/types'

type FilterStatus = 'all' | QuoteStatus
type FilterCustomer = 'all' | string

export default function Quotes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { fetchQuotes, fetchCustomers, getQuoteDetail, quotes, customers, loading } = useAppStore()

  const urlStatus = searchParams.get('status') as FilterStatus | null
  const initialStatus =
    urlStatus && ['active', 'expired', 'rejected'].includes(urlStatus)
      ? urlStatus
      : 'all'

  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialStatus)
  const [filterCustomer, setFilterCustomer] = useState<FilterCustomer>('all')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<CustomerQuote | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchQuotes()
    fetchCustomers()
  }, [fetchQuotes, fetchCustomers])

  const filteredQuotes = quotes.filter((q) => {
    const statusMatch = filterStatus === 'all' || q.status === filterStatus
    const customerMatch = filterCustomer === 'all' || q.customer_id === filterCustomer
    return statusMatch && customerMatch
  })

  const openDetail = async (quote: CustomerQuote) => {
    setDetailLoading(true)
    const detail = await getQuoteDetail(quote.id)
    if (detail) {
      setSelectedQuote(detail)
      setShowDetailModal(true)
    }
    setDetailLoading(false)
  }

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status)
    if (status === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const clearFilter = () => {
    setFilterStatus('all')
    setFilterCustomer('all')
    searchParams.delete('status')
    setSearchParams(searchParams)
  }

  const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '有效' },
    { value: 'expired', label: '已过期' },
    { value: 'rejected', label: '已拒绝' },
  ]

  const activeQuotes = quotes.filter((q) => q.status === 'active')

  return (
    <div className="space-y-6">
      {(filterStatus !== 'all' || filterCustomer !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">当前筛选：</span>
          {filterStatus !== 'all' && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                quoteStatusColors[filterStatus as QuoteStatus]
              }`}
            >
              {quoteStatusLabels[filterStatus as QuoteStatus]}
              <button
                onClick={() => handleFilterChange('all')}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterCustomer !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {customers.find((c) => c.id === filterCustomer)?.name || filterCustomer}
              <button
                onClick={() => setFilterCustomer('all')}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilter}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            清除所有筛选
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <MessageSquareQuote className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{quotes.length}</div>
              <div className="text-sm text-slate-500">总报价数</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <MessageSquareQuote className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{activeQuotes.length}</div>
              <div className="text-sm text-slate-500">有效报价</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <MessageSquareQuote className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{customers.length}</div>
              <div className="text-sm text-slate-500">合作客户</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>客户报价记录</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statusFilters.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value as FilterCustomer)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  报价编号
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  库存商品
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  报价价格
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  市场参考价
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  报价类型
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  有效期
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {quote.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{quote.customerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800">{quote.inventoryName}</div>
                    <div className="text-xs text-slate-500">
                      {quote.inventoryCategory} · {quote.inventoryGrade}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(quote.quoted_price)}/吨
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        quote.quoted_price >= quote.market_price ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {quote.quoted_price >= quote.market_price ? '↑' : '↓'}{' '}
                      {Math.abs(((quote.quoted_price - quote.market_price) / quote.market_price) * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {formatCurrency(quote.market_price)}/吨
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        adjustmentTypeColors[quote.adjustment_type]
                      }`}
                    >
                      {adjustmentTypeLabels[quote.adjustment_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        quoteStatusColors[quote.status]
                      }`}
                    >
                      {quoteStatusLabels[quote.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div>{formatDateTime(quote.created_at)}</div>
                    <div className="text-xs text-slate-500">
                      至 {quote.expires_at ? formatDateTime(quote.expires_at) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(quote)}>
                      <Eye className="w-4 h-4" />
                      详情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredQuotes.length === 0 && (
            <div className="py-12 text-center text-slate-500">暂无报价记录</div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedQuote(null)
        }}
        title="报价详情"
        size="lg"
      >
        {selectedQuote && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">报价编号</div>
                <div className="text-sm font-medium text-slate-800">{selectedQuote.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    quoteStatusColors[selectedQuote.status]
                  }`}
                >
                  {quoteStatusLabels[selectedQuote.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">客户</div>
                <div className="text-sm font-medium text-slate-800">{selectedQuote.customerName}</div>
                <div className="text-xs text-slate-500">{selectedQuote.customerContact}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">库存商品</div>
                <div className="text-sm font-medium text-slate-800">{selectedQuote.inventoryName}</div>
                <div className="text-xs text-slate-500">
                  {selectedQuote.inventoryCategory} · {selectedQuote.inventoryGrade}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">市场参考价</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatCurrency(selectedQuote.market_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">报价价格</div>
                <div className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(selectedQuote.quoted_price)}/吨
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">价格差异</div>
                <div
                  className={`text-sm font-semibold ${
                    selectedQuote.quoted_price >= selectedQuote.market_price
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {selectedQuote.quoted_price >= selectedQuote.market_price ? '↑' : '↓'}{' '}
                  {Math.abs(((selectedQuote.quoted_price - selectedQuote.market_price) / selectedQuote.market_price) * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">报价类型</div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    adjustmentTypeColors[selectedQuote.adjustment_type]
                  }`}
                >
                  {adjustmentTypeLabels[selectedQuote.adjustment_type]}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">报价单位</div>
                <div className="text-sm font-medium text-slate-800">
                  元/{selectedQuote.inventoryUnit}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">报价时间</div>
                <div className="text-sm font-medium text-slate-800">
                  {formatDateTime(selectedQuote.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">有效期至</div>
                <div className="text-sm font-medium text-slate-800">
                  {selectedQuote.expires_at ? formatDateTime(selectedQuote.expires_at) : '-'}
                </div>
              </div>
            </div>

            {selectedQuote.status === 'active' && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-sm font-medium text-emerald-800">
                  此报价当前有效，客户可按此价格进行采购。
                </div>
              </div>
            )}

            {selectedQuote.status === 'expired' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-800">
                  此报价已过期，如需继续合作需重新发起调价申请。
                </div>
              </div>
            )}

            {selectedQuote.status === 'rejected' && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm font-medium text-red-800">
                  此报价关联的调价申请已被拒绝，报价无效。
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {(loading || detailLoading) && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
