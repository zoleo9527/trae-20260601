import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react'
import { useExchangeStore } from '@/stores/exchangeStore'
import { useWarningStore } from '@/stores/warningStore'
import { useUserStore } from '@/stores/userStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { EXCHANGE_STATUS_LABELS } from '@/types'
import type { ExchangeStatus, Exchange } from '@/types'

function getExchangeStatusClasses(status: ExchangeStatus) {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400'
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'rejected':
      return 'bg-red-500/20 text-red-400'
    case 'completed':
      return 'bg-blue-500/20 text-blue-400'
    case 'supplemented':
      return 'bg-purple-500/20 text-purple-400'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const statusFilters: { label: string; value: ExchangeStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已完成', value: 'completed' },
  { label: '已补录', value: 'supplemented' },
]

function StatusBadge({ status }: { status: ExchangeStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getExchangeStatusClasses(status)}`}>
      {EXCHANGE_STATUS_LABELS[status]}
    </span>
  )
}

function ExchangeCard({ exchange }: { exchange: Exchange }) {
  const navigate = useNavigate()
  const { currentUser } = useUserStore()
  const { warnings } = useWarningStore()
  const { resubmitExchange } = useExchangeStore()
  const addLog = useOperationLogStore((s) => s.addLog)

  const warning = warnings.find((w) => w.id === exchange.warningId)
  const productName = warning?.productName ?? '未知产品'

  const stripeColor = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    completed: 'bg-blue-500',
    supplemented: 'bg-purple-500',
  }[exchange.status]

  const handleResubmit = () => {
    if (!currentUser) return
    resubmitExchange(exchange.id, {
      reason: exchange.reason,
      expectedHandling: exchange.expectedHandling,
    })
    addLog({
      type: 'resubmit_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `重新提交换货：${productName}，原因：${exchange.reason}`,
      isSupplement: false,
    })
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors flex gap-3">
      <div className={`w-1 shrink-0 rounded ${stripeColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-100 font-medium truncate">{productName}</span>
          <StatusBadge status={exchange.status} />
        </div>
        <div className="text-sm text-slate-400 mb-1 truncate">
          换货原因：{exchange.reason || '-'}
        </div>
        <div className="text-sm text-slate-400 mb-3 truncate">
          期望处理方式：{exchange.expectedHandling || '-'}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
            <span>申请人：{exchange.appliedByName || '-'}</span>
            <span>申请时间：{formatDate(exchange.appliedAt)}</span>
            {exchange.reviewedByName && (
              <span>审核人：{exchange.reviewedByName}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentUser?.role === 'warehouse' && exchange.status === 'rejected' && (
              <button
                onClick={handleResubmit}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新提交
              </button>
            )}
            <Link
              to={`/exchanges/${exchange.id}`}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              查看详情
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Exchanges() {
  const navigate = useNavigate()
  const { exchanges } = useExchangeStore()
  const { warnings } = useWarningStore()
  const { currentUser } = useUserStore()
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | 'all'>('all')

  const filtered = exchanges.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    return true
  })

  const pendingCount = exchanges.filter((e) => e.status === 'pending').length

  const confirmedWarningsWithoutExchange = warnings.filter(
    (w) => w.status === 'confirmed'
  )
  const confirmedWarningCount = confirmedWarningsWithoutExchange.length

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">换货处理</h1>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
              {pendingCount} 待审核
            </span>
          )}
        </div>
      </div>

      {currentUser?.role === 'warehouse' && confirmedWarningCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{confirmedWarningCount} 个已确认预警可提交换货</span>
          </div>
          <Link
            to="/warnings"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            前往查看
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              statusFilter === f.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">暂无换货记录</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((e) => (
            <ExchangeCard key={e.id} exchange={e} />
          ))}
        </div>
      )}
    </div>
  )
}
