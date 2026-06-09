import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, abnormalTypeLabels, processResultLabels, type BatchIssue } from '@/store'

const processResultOptions = [
  { value: 'exchange', label: '换货' },
  { value: 'return', label: '退货' },
  { value: 'special_approval', label: '特批放行' },
]

const roleUserNames: Record<string, string> = {
  sales: '张丽',
  warehouse: '王强',
  aftersales: '李敏',
}

export default function BatchIssueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [issue, setIssue] = useState<BatchIssue | null>(null)
  const [orderInfo, setOrderInfo] = useState<{ orderNo: string; customerName: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processResult, setProcessResult] = useState('')
  const [newBatchNo, setNewBatchNo] = useState('')
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [processNote, setProcessNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/batch-issues/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const d = data.data
        if (d) {
          setIssue(d.issue)
          setOrderInfo(d.order ? { orderNo: d.order.orderNo, customerName: d.order.customerName } : null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!issue || !processResult) return
    setSubmitting(true)
    try {
      await fetch(`/api/outbound-items/${issue.itemId}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processedBy: roleUserNames[currentRole],
          processResult,
          processNote,
          newBatchNo: processResult === 'exchange' ? newBatchNo : undefined,
          newExpiryDate: processResult === 'exchange' ? newExpiryDate : undefined,
          idempotencyKey: `process-${issue.itemId}-${Date.now()}`,
        }),
      })
      navigate('/batch-issues')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  if (!issue) {
    return <div className="flex items-center justify-center h-64 text-gray-400">未找到异常工单</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/batch-issues')}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">异常工单详情</h2>
      </div>

      <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">出库单号</p>
            <p className="text-sm font-medium text-indigo-700 mt-1">{issue.orderNo}</p>
          </div>
          {orderInfo && (
            <div>
              <p className="text-xs text-gray-400">客户名称</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{orderInfo.customerName}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">耗材名称</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{issue.consumableName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">批号</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{issue.batchNo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">异常类型</p>
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium mt-1">
              {abnormalTypeLabels[issue.abnormalType] || issue.abnormalType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">状态：</span>
            {issue.processStatus === 'pending' ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                待处理
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                已处理
              </span>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">异常说明</p>
            <p className="text-sm text-gray-700 mt-1">{issue.abnormalNote || '-'}</p>
          </div>
        </div>
      </div>

      {issue.processStatus === 'pending' ? (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">处理工单</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">处理结果</label>
            <select
              value={processResult}
              onChange={(e) => setProcessResult(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">请选择处理结果</option>
              {processResultOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {processResult === 'exchange' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">新批号</label>
                <input
                  type="text"
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="请输入新批号"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">新有效期</label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">处理备注</label>
            <textarea
              value={processNote}
              onChange={(e) => setProcessNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="请输入处理备注..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!processResult || submitting}
              className={cn(
                'rounded-lg px-6 py-2.5 text-sm font-medium shadow-sm transition-all',
                processResult && !submitting
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {submitting ? '提交中...' : '提交处理'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">处理结果</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">处理结果</p>
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium mt-1">
                {processResultLabels[issue.processResult || ''] || issue.processResult}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">处理人</p>
              <p className="text-sm text-gray-700 mt-1">{issue.processedBy || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">处理时间</p>
              <p className="text-sm text-gray-700 mt-1">{issue.processedAt || '-'}</p>
            </div>
          </div>
          {issue.processNote && (
            <div>
              <p className="text-xs text-gray-400">处理备注</p>
              <p className="text-sm text-gray-700 mt-1">{issue.processNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
