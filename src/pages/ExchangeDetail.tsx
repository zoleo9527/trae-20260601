import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, AlertCircle, Info, CheckCircle, XCircle, RefreshCw, ExternalLink, FileText } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useExchangeStore } from '@/stores/exchangeStore'
import { useWarningStore } from '@/stores/warningStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useRecentStore } from '@/stores/recentStore'
import {
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_RESULT_LABELS,
  URGENCY_LABELS,
  OPERATION_TYPE_LABELS,
  ROLE_LABELS,
} from '@/types'
import type { ExchangeStatus, ExchangeResult, Urgency } from '@/types'

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  critical: {
    label: URGENCY_LABELS.critical,
    color: 'text-red-400',
    bg: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  urgent: {
    label: URGENCY_LABELS.urgent,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  normal: {
    label: URGENCY_LABELS.normal,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Info className="w-4 h-4" />,
  },
}

const STATUS_BADGE: Record<ExchangeStatus, { label: string; bg: string }> = {
  pending: { label: EXCHANGE_STATUS_LABELS.pending, bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  approved: { label: EXCHANGE_STATUS_LABELS.approved, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected: { label: EXCHANGE_STATUS_LABELS.rejected, bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completed: { label: EXCHANGE_STATUS_LABELS.completed, bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  supplemented: { label: EXCHANGE_STATUS_LABELS.supplemented, bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

const RESULT_BADGE: Record<ExchangeResult, { label: string; bg: string }> = {
  return_supplier: { label: EXCHANGE_RESULT_LABELS.return_supplier, bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  replace_new: { label: EXCHANGE_RESULT_LABELS.replace_new, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  scrap: { label: EXCHANGE_RESULT_LABELS.scrap, bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  other: { label: EXCHANGE_RESULT_LABELS.other, bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const OP_DOT_COLOR: Record<string, string> = {
  create_warning: 'bg-blue-400',
  confirm_warning: 'bg-emerald-400',
  reject_warning: 'bg-red-400',
  resubmit_warning: 'bg-amber-400',
  create_exchange: 'bg-purple-400',
  approve_exchange: 'bg-emerald-400',
  reject_exchange: 'bg-red-400',
  complete_exchange: 'bg-emerald-400',
  supplement_exchange: 'bg-amber-400',
  resubmit_exchange: 'bg-amber-400',
}

function formatTime(iso: string) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExchangeDetail() {
  const { exchangeId } = useParams<{ exchangeId: string }>()
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const exchanges = useExchangeStore((s) => s.exchanges)
  const approveExchange = useExchangeStore((s) => s.approveExchange)
  const rejectExchange = useExchangeStore((s) => s.rejectExchange)
  const completeExchange = useExchangeStore((s) => s.completeExchange)
  const supplementExchange = useExchangeStore((s) => s.supplementExchange)
  const resubmitExchange = useExchangeStore((s) => s.resubmitExchange)
  const warnings = useWarningStore((s) => s.warnings)
  const addLog = useOperationLogStore((s) => s.addLog)
  const getByRelatedId = useOperationLogStore((s) => s.getByRelatedId)
  const addRecent = useRecentStore((s) => s.addRecent)

  const exchange = exchanges.find((e) => e.id === exchangeId)
  const warning = exchange ? warnings.find((w) => w.id === exchange.warningId) : null

  const [activeForm, setActiveForm] = useState<'approve' | 'reject' | 'complete' | 'supplement' | 'resubmit' | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [completeData, setCompleteData] = useState<{ result: ExchangeResult; resultNote: string }>({ result: 'return_supplier', resultNote: '' })
  const [supplementData, setSupplementData] = useState({ supplementNote: '', attachmentName: '', attachmentNote: '' })
  const [resubmitData, setResubmitData] = useState({ reason: '', expectedHandling: '' })

  useEffect(() => {
    if (exchange && currentUser) {
      addRecent({
        userId: currentUser.id,
        itemId: exchange.id,
        itemType: 'exchange',
        itemTitle: warning?.productName || exchange.id,
        accessedAt: new Date().toISOString(),
      })
    }
  }, [exchange?.id, currentUser?.id])

  useEffect(() => {
    if (exchange) {
      setResubmitData({ reason: exchange.reason, expectedHandling: exchange.expectedHandling })
    }
  }, [exchange?.id])

  if (!exchange) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-lg">未找到该换货记录</p>
      </div>
    )
  }

  const statusBadge = STATUS_BADGE[exchange.status]
  const resultBadge = exchange.result ? RESULT_BADGE[exchange.result] : null
  const urgencyConf = warning ? URGENCY_CONFIG[warning.urgency] : null
  const logs = getByRelatedId(exchange.id).sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
  const role = currentUser?.role

  const handleApprove = () => {
    if (!currentUser) return
    approveExchange(exchange.id, reviewNote, currentUser)
    addLog({
      type: 'approve_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `审批通过：${warning?.productName || ''}${reviewNote ? '，审核备注：' + reviewNote : ''}`,
      isSupplement: false,
    })
    setReviewNote('')
    setActiveForm(null)
  }

  const handleReject = () => {
    if (!currentUser || !rejectReason.trim()) return
    rejectExchange(exchange.id, rejectReason, currentUser)
    addLog({
      type: 'reject_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `驳回换货：${warning?.productName || ''}，原因：${rejectReason}`,
      isSupplement: false,
    })
    setRejectReason('')
    setActiveForm(null)
  }

  const handleComplete = () => {
    if (!currentUser) return
    completeExchange(exchange.id, completeData.result, completeData.resultNote, currentUser)
    addLog({
      type: 'complete_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `填写处理结果：${EXCHANGE_RESULT_LABELS[completeData.result]}${completeData.resultNote ? '，备注：' + completeData.resultNote : ''}`,
      isSupplement: false,
    })
    setCompleteData({ result: 'return_supplier', resultNote: '' })
    setActiveForm(null)
  }

  const handleSupplement = () => {
    if (!currentUser) return
    supplementExchange(exchange.id, supplementData.supplementNote, currentUser)
    addLog({
      type: 'supplement_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `补录信息：${supplementData.supplementNote}${supplementData.attachmentName ? '，附件：' + supplementData.attachmentName : ''}${supplementData.attachmentNote ? '，附件备注：' + supplementData.attachmentNote : ''}`,
      isSupplement: true,
    })
    setSupplementData({ supplementNote: '', attachmentName: '', attachmentNote: '' })
    setActiveForm(null)
  }

  const handleResubmit = () => {
    if (!currentUser) return
    resubmitExchange(exchange.id, resubmitData)
    addLog({
      type: 'resubmit_exchange',
      relatedId: exchange.id,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `重新提交换货：${warning?.productName || ''}，原因：${resubmitData.reason}`,
      isSupplement: false,
    })
    setActiveForm(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/exchanges"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">换货详情</h1>
              {warning && <span className="text-lg text-slate-300">{warning.productName}</span>}
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
              {resultBadge && (
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${resultBadge.bg}`}>
                  {resultBadge.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-base font-semibold text-white mb-4">换货信息</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <span className="text-xs text-slate-500">换货原因</span>
              <p className="text-sm text-white">{exchange.reason}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">期望处理方式</span>
              <p className="text-sm text-white">{exchange.expectedHandling}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">申请人</span>
              <p className="text-sm text-white">{exchange.appliedByName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">申请时间</span>
              <p className="text-sm text-white">{formatTime(exchange.appliedAt)}</p>
            </div>
            {(exchange.status === 'approved' || exchange.status === 'completed' || exchange.status === 'supplemented') && (
              <>
                <div>
                  <span className="text-xs text-slate-500">审核人</span>
                  <p className="text-sm text-white">{exchange.reviewedByName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">审核时间</span>
                  <p className="text-sm text-white">{formatTime(exchange.reviewedAt)}</p>
                </div>
                {exchange.reviewNote && (
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500">审核备注</span>
                    <p className="text-sm text-white">{exchange.reviewNote}</p>
                  </div>
                )}
              </>
            )}
            {exchange.status === 'rejected' && (
              <>
                <div>
                  <span className="text-xs text-slate-500">审核人</span>
                  <p className="text-sm text-white">{exchange.reviewedByName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">审核时间</span>
                  <p className="text-sm text-white">{formatTime(exchange.reviewedAt)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500">驳回原因</span>
                  <p className="text-sm text-red-400">{exchange.rejectReason}</p>
                </div>
              </>
            )}
            {(exchange.status === 'completed' || exchange.status === 'supplemented') && exchange.result && (
              <>
                <div>
                  <span className="text-xs text-slate-500">处理结果</span>
                  <p className="text-sm text-white">{EXCHANGE_RESULT_LABELS[exchange.result]}</p>
                </div>
                {exchange.resultNote && (
                  <div>
                    <span className="text-xs text-slate-500">处理备注</span>
                    <p className="text-sm text-white">{exchange.resultNote}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500">完成时间</span>
                  <p className="text-sm text-white">{formatTime(exchange.completedAt)}</p>
                </div>
              </>
            )}
            {exchange.status === 'supplemented' && (
              <>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500">补录内容</span>
                  <p className="text-sm text-white">{exchange.supplementNote}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">补录人</span>
                  <p className="text-sm text-white">{exchange.supplementByName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">补录时间</span>
                  <p className="text-sm text-white">{formatTime(exchange.supplementedAt)}</p>
                </div>
              </>
            )}
            {exchange.attachmentName && (
              <>
                <div>
                  <span className="text-xs text-slate-500">附件名称</span>
                  <p className="text-sm text-white">{exchange.attachmentName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">附件备注</span>
                  <p className="text-sm text-white">{exchange.attachmentNote}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">仅记录文件名，非真实文件存储</p>
                </div>
              </>
            )}
          </div>

          {warning && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h2 className="text-base font-semibold text-white mb-4">关联预警</h2>
              <Link
                to={`/warnings/${warning.id}`}
                className="flex items-center justify-between bg-slate-700/50 rounded-lg border border-slate-600/50 p-4 hover:bg-slate-700 hover:border-blue-500/30 transition-colors"
              >
                <div>
                  <p className="text-sm text-white">{warning.productName}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    批号：{warning.batchNo} · 有效期：{warning.expiryDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {urgencyConf && (
                    <span className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${urgencyConf.bg}`}>
                      {urgencyConf.icon}
                      {urgencyConf.label}
                    </span>
                  )}
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6">
          {role === 'aftersales' && exchange.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => setActiveForm(activeForm === 'approve' ? null : 'approve')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={() => setActiveForm(activeForm === 'reject' ? null : 'reject')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                驳回
              </button>
            </div>
          )}
          {role === 'aftersales' && exchange.status === 'approved' && (
            <button
              onClick={() => setActiveForm(activeForm === 'complete' ? null : 'complete')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              填写处理结果
            </button>
          )}
          {role === 'sales' && (exchange.status === 'completed' || exchange.status === 'supplemented') && (
            <button
              onClick={() => setActiveForm(activeForm === 'supplement' ? null : 'supplement')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              补录信息
            </button>
          )}
          {role === 'warehouse' && exchange.status === 'rejected' && (
            <button
              onClick={() => setActiveForm(activeForm === 'resubmit' ? null : 'resubmit')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新提交
            </button>
          )}
        </div>

        {activeForm === 'approve' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">审批通过</h3>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="输入审核备注（可选）"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
              >
                确认通过
              </button>
              <button
                onClick={() => { setActiveForm(null); setReviewNote('') }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {activeForm === 'reject' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">驳回换货</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="输入驳回原因（必填）"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
              <button
                onClick={() => { setActiveForm(null); setRejectReason('') }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {activeForm === 'complete' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">填写处理结果</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">处理结果</label>
                <select
                  value={completeData.result}
                  onChange={(e) => setCompleteData({ ...completeData, result: e.target.value as ExchangeResult })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="return_supplier">退回供应商</option>
                  <option value="replace_new">换新入库</option>
                  <option value="scrap">报废处理</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">处理备注</label>
                <textarea
                  value={completeData.resultNote}
                  onChange={(e) => setCompleteData({ ...completeData, resultNote: e.target.value })}
                  placeholder="输入处理备注（可选）"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleComplete}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                提交结果
              </button>
              <button
                onClick={() => { setActiveForm(null); setCompleteData({ result: 'return_supplier', resultNote: '' }) }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {activeForm === 'supplement' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">补录信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">补录内容</label>
                <textarea
                  value={supplementData.supplementNote}
                  onChange={(e) => setSupplementData({ ...supplementData, supplementNote: e.target.value })}
                  placeholder="输入补录内容"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">附件名称</label>
                <input
                  value={supplementData.attachmentName}
                  onChange={(e) => setSupplementData({ ...supplementData, attachmentName: e.target.value })}
                  placeholder="输入附件文件名"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-xs text-slate-500 mt-1">仅记录文件名，非真实文件存储</p>
              </div>
              <div>
                <label className="text-xs text-slate-500">附件备注</label>
                <input
                  value={supplementData.attachmentNote}
                  onChange={(e) => setSupplementData({ ...supplementData, attachmentNote: e.target.value })}
                  placeholder="输入附件备注"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSupplement}
                disabled={!supplementData.supplementNote.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交补录
              </button>
              <button
                onClick={() => { setActiveForm(null); setSupplementData({ supplementNote: '', attachmentName: '', attachmentNote: '' }) }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {activeForm === 'resubmit' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">重新提交换货</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">换货原因</label>
                <textarea
                  value={resubmitData.reason}
                  onChange={(e) => setResubmitData({ ...resubmitData, reason: e.target.value })}
                  placeholder="输入换货原因"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">期望处理方式</label>
                <textarea
                  value={resubmitData.expectedHandling}
                  onChange={(e) => setResubmitData({ ...resubmitData, expectedHandling: e.target.value })}
                  placeholder="输入期望处理方式"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleResubmit}
                disabled={!resubmitData.reason.trim() || !resubmitData.expectedHandling.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重新提交
              </button>
              <button
                onClick={() => setActiveForm(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-base font-semibold text-white mb-4">操作记录</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">暂无操作记录</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${OP_DOT_COLOR[log.type] || 'bg-slate-400'}`} />
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-white font-medium">
                          {OPERATION_TYPE_LABELS[log.type]}
                        </span>
                        {log.isSupplement && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                            补录
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{log.detail}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>{log.operatorName}</span>
                        <span>·</span>
                        <span>{ROLE_LABELS[log.operatorRole]}</span>
                        <span>·</span>
                        <span>{formatTime(log.operatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
