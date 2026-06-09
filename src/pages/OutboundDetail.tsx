import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import { useAppStore, abnormalTypeLabels, type OutboundOrder } from '@/store'

function isNearExpiry(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 90 && diff > 0
}

function isExpired(date: string) {
  return new Date(date) < new Date()
}

function formatTime(iso: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const roleUserNames: Record<string, string> = {
  sales: '张丽',
  warehouse: '王强',
  aftersales: '李敏',
}

export default function OutboundDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [order, setOrder] = useState<OutboundOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSnapshots, setExpandedSnapshots] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/outbound-orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.data || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const toggleSnapshot = (snapId: string) => {
    setExpandedSnapshots((prev) => ({ ...prev, [snapId]: !prev[snapId] }))
  }

  const handleSubmit = async () => {
    if (!id) return
    setSubmitting(true)
    try {
      await fetch(`/api/outbound-orders/${id}/submit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submittedBy: roleUserNames[currentRole],
          idempotencyKey: `submit-${id}-${Date.now()}`,
        }),
      })
      window.location.reload()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  if (!order) {
    return <div className="flex items-center justify-center h-64 text-gray-400">未找到出库单</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">出库单详情</h2>
        <StatusBadge status={order.status} className="ml-2" />
      </div>

      <div className="rounded-xl bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">基本信息</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">出库单号</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.orderNo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">客户名称</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">资质到期日</p>
            <p
              className={cn(
                'text-sm font-medium mt-1',
                isExpired(order.customerQualExpiry)
                  ? 'text-red-600'
                  : isNearExpiry(order.customerQualExpiry)
                    ? 'text-amber-600'
                    : 'text-gray-900'
              )}
            >
              {order.customerQualExpiry}
              {isExpired(order.customerQualExpiry) && (
                <AlertTriangle className="inline h-3.5 w-3.5 ml-1" />
              )}
              {isNearExpiry(order.customerQualExpiry) && !isExpired(order.customerQualExpiry) && (
                <AlertTriangle className="inline h-3.5 w-3.5 ml-1 text-amber-500" />
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">提交人</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.submittedBy || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">提交时间</p>
            <p className="text-sm text-gray-700 mt-1">{formatTime(order.submittedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">复核人</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.reviewedBy || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">复核时间</p>
            <p className="text-sm text-gray-700 mt-1">{formatTime(order.reviewedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">创建时间</p>
            <p className="text-sm text-gray-700 mt-1">{formatTime(order.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {order.status === 'pending_submit' && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交出库'}
          </button>
        )}
        {(order.status === 'pending_review' || order.status === 'reviewing') && (
          <button
            onClick={() => navigate(`/outbound/${id}/review`)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            开始复核
          </button>
        )}
        <button
          onClick={() => navigate(`/outbound/${id}/replay`)}
          className="rounded-lg px-5 py-2.5 text-sm font-medium bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors inline-flex items-center gap-1.5"
        >
          <Play className="h-4 w-4" />
          复核回看
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-500">出库明细</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">耗材名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">批号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">生产日期</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">有效期至</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">库存数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">出库数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">复核状态</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b last:border-0',
                  item.reviewStatus === 'abnormal' && 'bg-red-50/50'
                )}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{item.consumableName}</td>
                <td className="px-4 py-3 text-gray-700">{item.batchNo}</td>
                <td className="px-4 py-3 text-gray-500">{item.productionDate}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      isExpired(item.expiryDate)
                        ? 'text-red-600 font-medium'
                        : isNearExpiry(item.expiryDate)
                          ? 'text-amber-600 font-medium'
                          : 'text-gray-700'
                    )}
                  >
                    {item.expiryDate}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{item.stockQty}</td>
                <td className="px-4 py-3 text-gray-700">{item.outboundQty}</td>
                <td className="px-4 py-3">
                  {item.reviewStatus === 'normal' && (
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                      正常
                    </span>
                  )}
                  {item.reviewStatus === 'abnormal' && (
                    <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                      异常·{abnormalTypeLabels[item.abnormalType || ''] || item.abnormalType}
                    </span>
                  )}
                  {item.reviewStatus === 'pending' && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 px-2.5 py-0.5 text-xs font-medium">
                      待复核
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">操作记录</h3>
          <Timeline entries={order.timeline} />
        </div>

        <div className="rounded-xl bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">复核快照</h3>
          {order.reviewSnapshots.length === 0 ? (
            <p className="text-sm text-gray-400">暂无复核记录</p>
          ) : (
            <div className="space-y-3">
              {order.reviewSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSnapshot(snapshot.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{snapshot.reviewedBy}</span>
                      <span className="text-xs text-gray-400">{formatTime(snapshot.reviewAt)}</span>
                    </div>
                    {expandedSnapshots[snapshot.id] ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSnapshots[snapshot.id] && (
                    <div className="px-4 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="py-1.5 text-left font-medium text-gray-500">耗材</th>
                            <th className="py-1.5 text-left font-medium text-gray-500">批号</th>
                            <th className="py-1.5 text-left font-medium text-gray-500">结果</th>
                            <th className="py-1.5 text-left font-medium text-gray-500">异常类型</th>
                            <th className="py-1.5 text-left font-medium text-gray-500">备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshot.items.map((si) => (
                            <tr
                              key={si.id}
                              className={cn(
                                'border-b last:border-0',
                                si.result === 'abnormal' && 'bg-amber-50'
                              )}
                            >
                              <td className="py-1.5 text-gray-700">{si.consumableName}</td>
                              <td className="py-1.5 text-gray-700">{si.batchNo}</td>
                              <td className="py-1.5">
                                {si.result === 'normal' ? (
                                  <span className="text-green-600">正常</span>
                                ) : (
                                  <span className="text-red-600">异常</span>
                                )}
                              </td>
                              <td className="py-1.5 text-gray-500">
                                {si.abnormalType ? abnormalTypeLabels[si.abnormalType] || si.abnormalType : '-'}
                              </td>
                              <td className="py-1.5 text-gray-500">{si.abnormalNote || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
