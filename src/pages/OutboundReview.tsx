import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, abnormalTypeLabels, type OutboundOrder, type OutboundItem } from '@/store'

const abnormalTypeOptions = [
  { value: 'batch_error', label: '批号错误' },
  { value: 'near_expiry', label: '临期' },
  { value: 'expired', label: '已过期' },
  { value: 'qual_expired', label: '资质过期' },
]

interface ItemReview {
  result: 'normal' | 'abnormal' | null
  abnormalType: string
  abnormalNote: string
}

const roleUserNames: Record<string, string> = {
  sales: '张丽',
  warehouse: '王强',
  aftersales: '李敏',
}

export default function OutboundReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [order, setOrder] = useState<OutboundOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Record<string, ItemReview>>({})
  const [submitting, setSubmitting] = useState(false)
  const [expandedAbnormal, setExpandedAbnormal] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/outbound-orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const ord = data.data || null
        setOrder(ord)
        if (ord) {
          const init: Record<string, ItemReview> = {}
          ord.items.forEach((item: OutboundItem) => {
            init[item.id] = {
              result: item.reviewStatus === 'normal' ? 'normal' : item.reviewStatus === 'abnormal' ? 'abnormal' : null,
              abnormalType: item.abnormalType || '',
              abnormalNote: item.abnormalNote || '',
            }
          })
          setReviews(init)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const allReviewed = order
    ? order.items.every((item) => reviews[item.id]?.result !== null)
    : false

  const handleReview = (itemId: string, result: 'normal' | 'abnormal') => {
    setReviews((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], result },
    }))
    if (result === 'abnormal') {
      setExpandedAbnormal((prev) => ({ ...prev, [itemId]: true }))
    } else {
      setExpandedAbnormal((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const handleSubmit = async () => {
    if (!id || !order || !allReviewed) return
    setSubmitting(true)
    try {
      const reviewItems = order.items.map((item) => {
        const r = reviews[item.id]
        return {
          itemId: item.id,
          result: r.result,
          abnormalType: r.result === 'abnormal' ? r.abnormalType : undefined,
          abnormalNote: r.result === 'abnormal' ? r.abnormalNote : undefined,
        }
      })
      await fetch(`/api/outbound-orders/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: roleUserNames[currentRole],
          reviewItems,
          idempotencyKey: `review-${id}-${Date.now()}`,
        }),
      })
      navigate(`/outbound/${id}`)
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/outbound/${id}`)}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">复核出库单</h2>
      </div>

      <div className="rounded-xl bg-white shadow-sm p-5">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-400">出库单号：</span>
            <span className="font-medium text-gray-900">{order.orderNo}</span>
          </div>
          <div>
            <span className="text-gray-400">客户：</span>
            <span className="font-medium text-gray-900">{order.customerName}</span>
          </div>
          <div>
            <span className="text-gray-400">提交人：</span>
            <span className="font-medium text-gray-900">{order.submittedBy}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {order.items.map((item) => {
          const review = reviews[item.id]
          return (
            <div key={item.id} className="rounded-xl bg-white shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{item.consumableName}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>批号：{item.batchNo}</span>
                    <span>有效期：{item.expiryDate}</span>
                    <span>库存：{item.stockQty}</span>
                    <span>出库数量：{item.outboundQty}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(item.id, 'normal')}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all inline-flex items-center gap-1.5',
                      review?.result === 'normal'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    )}
                  >
                    <CheckCircle className="h-4 w-4" />
                    正常
                  </button>
                  <button
                    onClick={() => handleReview(item.id, 'abnormal')}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-all inline-flex items-center gap-1.5',
                      review?.result === 'abnormal'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    异常
                  </button>
                </div>
              </div>

              {review?.result === 'abnormal' && expandedAbnormal[item.id] && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">异常类型</label>
                    <select
                      value={review.abnormalType}
                      onChange={(e) =>
                        setReviews((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], abnormalType: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">请选择异常类型</option>
                      {abnormalTypeOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">异常说明</label>
                    <textarea
                      value={review.abnormalNote}
                      onChange={(e) =>
                        setReviews((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], abnormalNote: e.target.value },
                        }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="请输入异常说明..."
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!allReviewed || submitting}
          className={cn(
            'rounded-lg px-8 py-2.5 text-sm font-medium shadow-sm transition-all',
            allReviewed && !submitting
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {submitting ? '提交中...' : '提交复核'}
        </button>
      </div>
    </div>
  )
}
