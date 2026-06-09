import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import type { OutboundOrder, OutboundOrderStatus } from '@/store'

const statusCards: { status: OutboundOrderStatus | 'all'; label: string; color: string }[] = [
  { status: 'all', label: '全部', color: 'bg-gray-500' },
  { status: 'pending_submit', label: '待提交', color: 'bg-gray-400' },
  { status: 'pending_review', label: '待复核', color: 'bg-blue-500' },
  { status: 'reviewing', label: '复核中', color: 'bg-purple-500' },
  { status: 'completed', label: '已完成', color: 'bg-green-500' },
  { status: 'has_issue', label: '已异常', color: 'bg-red-500' },
  { status: 'closed', label: '已关闭', color: 'bg-gray-400' },
]

export default function OutboundList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [filterStatus, setFilterStatus] = useState<OutboundOrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    fetch(`/api/outbound-orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.data?.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterStatus])

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const filtered = orders.filter((o) => {
    if (!search) return true
    return (
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-3">
        {statusCards.map((card) => (
          <button
            key={card.status}
            onClick={() => setFilterStatus(card.status)}
            className={cn(
              'rounded-xl p-4 text-center transition-all hover:shadow-md',
              filterStatus === card.status
                ? 'bg-white shadow-md ring-2 ring-indigo-500'
                : 'bg-white shadow-sm hover:ring-1 hover:ring-gray-200'
            )}
          >
            <div className={cn('mx-auto mb-2 h-2 w-8 rounded-full', card.color)} />
            <p className="text-2xl font-bold text-gray-900">
              {card.status === 'all' ? orders.length : (statusCounts[card.status] || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索出库单号或客户名称"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">出库单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">客户名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">提交人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">复核人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-indigo-700">{order.orderNo}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-gray-700">{order.submittedBy}</td>
                  <td className="px-4 py-3 text-gray-700">{order.reviewedBy || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/outbound/${order.id}`)}
                        className="rounded-lg px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        详情
                      </button>
                      {(order.status === 'pending_review' || order.status === 'reviewing') && (
                        <button
                          onClick={() => navigate(`/outbound/${order.id}/review`)}
                          className="rounded-lg px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          复核
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
