import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, AlertCircle, Info, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useWarningStore } from '@/stores/warningStore'
import { useExchangeStore } from '@/stores/exchangeStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { useRecentStore } from '@/stores/recentStore'
import {
  WARNING_STATUS_LABELS,
  URGENCY_LABELS,
  ROLE_LABELS,
  OPERATION_TYPE_LABELS,
} from '@/types'
import type { Urgency, WarningStatus } from '@/types'

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

const STATUS_BADGE: Record<WarningStatus, { label: string; bg: string }> = {
  pending: { label: WARNING_STATUS_LABELS.pending, bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: WARNING_STATUS_LABELS.confirmed, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected: { label: WARNING_STATUS_LABELS.rejected, bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
  exchanged: { label: WARNING_STATUS_LABELS.exchanged, bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
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

export default function WarningDetail() {
  const { warningId } = useParams<{ warningId: string }>()
  const navigate = useNavigate()
  const currentUser = useUserStore((s) => s.currentUser)
  const warnings = useWarningStore((s) => s.warnings)
  const confirmWarning = useWarningStore((s) => s.confirmWarning)
  const rejectWarning = useWarningStore((s) => s.rejectWarning)
  const resubmitWarning = useWarningStore((s) => s.resubmitWarning)
  const linkExchange = useWarningStore((s) => s.linkExchange)
  const addExchange = useExchangeStore((s) => s.addExchange)
  const exchanges = useExchangeStore((s) => s.exchanges)
  const addLog = useOperationLogStore((s) => s.addLog)
  const getByRelatedId = useOperationLogStore((s) => s.getByRelatedId)
  const addRecent = useRecentStore((s) => s.addRecent)

  const warning = warnings.find((w) => w.id === warningId)

  const [activeForm, setActiveForm] = useState<'confirm' | 'reject' | 'resubmit' | 'exchange' | null>(null)
  const [confirmNote, setConfirmNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [resubmitData, setResubmitData] = useState({
    productName: '',
    batchNo: '',
    expiryDate: '',
    quantity: 0,
    unit: '',
    storageLocation: '',
    urgency: 'normal' as Urgency,
    note: '',
  })
  const [exchangeData, setExchangeData] = useState({ reason: '', expectedHandling: '' })

  useEffect(() => {
    if (warning && currentUser) {
      addRecent({
        userId: currentUser.id,
        itemId: warning.id,
        itemType: 'warning',
        itemTitle: warning.productName,
        accessedAt: new Date().toISOString(),
      })
    }
  }, [warning?.id, currentUser?.id])

  useEffect(() => {
    if (warning) {
      setResubmitData({
        productName: warning.productName,
        batchNo: warning.batchNo,
        expiryDate: warning.expiryDate,
        quantity: warning.quantity,
        unit: warning.unit,
        storageLocation: warning.storageLocation,
        urgency: warning.urgency,
        note: warning.note,
      })
    }
  }, [warning?.id])

  if (!warning) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-lg">未找到该预警记录</p>
      </div>
    )
  }

  const urgencyConf = URGENCY_CONFIG[warning.urgency]
  const statusBadge = STATUS_BADGE[warning.status]
  const logs = getByRelatedId(warning.id).sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))

  const relatedExchange = warning.status === 'exchanged'
    ? exchanges.find((e) => e.warningId === warning.id)
    : null

  const role = currentUser?.role

  const handleConfirm = () => {
    if (!currentUser) return
    confirmWarning(warning.id, confirmNote, currentUser)
    addLog({
      type: 'confirm_warning',
      relatedId: warning.id,
      relatedType: 'warning',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `确认预警：${warning.productName}（${warning.batchNo}）${confirmNote ? '，备注：' + confirmNote : ''}`,
      isSupplement: false,
    })
    setConfirmNote('')
    setActiveForm(null)
  }

  const handleReject = () => {
    if (!currentUser || !rejectReason.trim()) return
    rejectWarning(warning.id, rejectReason, currentUser)
    addLog({
      type: 'reject_warning',
      relatedId: warning.id,
      relatedType: 'warning',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `退回预警：${warning.productName}（${warning.batchNo}），原因：${rejectReason}`,
      isSupplement: false,
    })
    setRejectReason('')
    setActiveForm(null)
  }

  const handleResubmit = () => {
    if (!currentUser) return
    resubmitWarning(warning.id, resubmitData)
    addLog({
      type: 'resubmit_warning',
      relatedId: warning.id,
      relatedType: 'warning',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `重新提交预警：${resubmitData.productName}（${resubmitData.batchNo}）`,
      isSupplement: false,
    })
    setActiveForm(null)
  }

  const handleExchange = () => {
    if (!currentUser || !exchangeData.reason.trim() || !exchangeData.expectedHandling.trim()) return
    const newExchangeId = addExchange({
      warningId: warning.id,
      reason: exchangeData.reason,
      expectedHandling: exchangeData.expectedHandling,
      appliedById: currentUser.id,
      appliedByName: currentUser.name,
    })
    linkExchange(warning.id, newExchangeId)
    addLog({
      type: 'create_exchange',
      relatedId: newExchangeId,
      relatedType: 'exchange',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      operatedAt: new Date().toISOString(),
      detail: `提交换货申请：${warning.productName}（${warning.batchNo}），原因：${exchangeData.reason}`,
      isSupplement: false,
    })
    setExchangeData({ reason: '', expectedHandling: '' })
    setActiveForm(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/warnings"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{warning.productName}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
              <span className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border ${urgencyConf.bg}`}>
                {urgencyConf.icon}
                {urgencyConf.label}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">批号：{warning.batchNo}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-base font-semibold text-white mb-4">预警信息</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <span className="text-xs text-slate-500">产品名称</span>
              <p className="text-sm text-white">{warning.productName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">批号</span>
              <p className="text-sm text-white">{warning.batchNo}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">有效期</span>
              <p className="text-sm text-white">{warning.expiryDate}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">数量/单位</span>
              <p className="text-sm text-white">{warning.quantity} {warning.unit}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">仓库位置</span>
              <p className="text-sm text-white">{warning.storageLocation}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">紧急程度</span>
              <p className={`text-sm ${urgencyConf.color}`}>{urgencyConf.label}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">提交人</span>
              <p className="text-sm text-white">{warning.createdByName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">提交时间</span>
              <p className="text-sm text-white">{formatTime(warning.createdAt)}</p>
            </div>
            {warning.status === 'confirmed' && (
              <>
                <div>
                  <span className="text-xs text-slate-500">确认人</span>
                  <p className="text-sm text-white">{warning.confirmedByName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">确认时间</span>
                  <p className="text-sm text-white">{formatTime(warning.confirmedAt)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500">确认备注</span>
                  <p className="text-sm text-white">{warning.confirmNote || '-'}</p>
                </div>
              </>
            )}
            {warning.status === 'rejected' && (
              <div className="col-span-2">
                <span className="text-xs text-slate-500">退回原因</span>
                <p className="text-sm text-red-400">{warning.rejectReason}</p>
              </div>
            )}
          </div>
          {warning.note && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <span className="text-xs text-slate-500">备注</span>
              <p className="text-sm text-slate-300 mt-1">{warning.note}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          {role === 'warehouse' && warning.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => setActiveForm(activeForm === 'confirm' ? null : 'confirm')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                确认预警
              </button>
              <button
                onClick={() => setActiveForm(activeForm === 'reject' ? null : 'reject')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                退回预警
              </button>
            </div>
          )}
          {role === 'sales' && warning.status === 'rejected' && (
            <button
              onClick={() => setActiveForm(activeForm === 'resubmit' ? null : 'resubmit')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新提交
            </button>
          )}
          {role === 'warehouse' && warning.status === 'confirmed' && (
            <button
              onClick={() => setActiveForm(activeForm === 'exchange' ? null : 'exchange')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              提交换货申请
            </button>
          )}
        </div>

        {activeForm === 'confirm' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">确认预警</h3>
            <textarea
              value={confirmNote}
              onChange={(e) => setConfirmNote(e.target.value)}
              placeholder="输入确认备注（可选）"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleConfirm}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
              >
                确认
              </button>
              <button
                onClick={() => { setActiveForm(null); setConfirmNote('') }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {activeForm === 'reject' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">退回预警</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="输入退回原因（必填）"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                退回
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

        {activeForm === 'resubmit' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">重新提交预警</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">产品名称</label>
                <input
                  value={resubmitData.productName}
                  onChange={(e) => setResubmitData({ ...resubmitData, productName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">批号</label>
                <input
                  value={resubmitData.batchNo}
                  onChange={(e) => setResubmitData({ ...resubmitData, batchNo: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">有效期</label>
                <input
                  type="date"
                  value={resubmitData.expiryDate}
                  onChange={(e) => setResubmitData({ ...resubmitData, expiryDate: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">数量</label>
                <input
                  type="number"
                  value={resubmitData.quantity}
                  onChange={(e) => setResubmitData({ ...resubmitData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">单位</label>
                <input
                  value={resubmitData.unit}
                  onChange={(e) => setResubmitData({ ...resubmitData, unit: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">仓库位置</label>
                <input
                  value={resubmitData.storageLocation}
                  onChange={(e) => setResubmitData({ ...resubmitData, storageLocation: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">紧急程度</label>
                <select
                  value={resubmitData.urgency}
                  onChange={(e) => setResubmitData({ ...resubmitData, urgency: e.target.value as Urgency })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="critical">7天内到期</option>
                  <option value="urgent">30天内到期</option>
                  <option value="normal">90天内到期</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">备注</label>
                <input
                  value={resubmitData.note}
                  onChange={(e) => setResubmitData({ ...resubmitData, note: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleResubmit}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors"
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

        {activeForm === 'exchange' && (
          <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">提交换货申请</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">换货原因</label>
                <textarea
                  value={exchangeData.reason}
                  onChange={(e) => setExchangeData({ ...exchangeData, reason: e.target.value })}
                  placeholder="输入换货原因（必填）"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">期望处理方式</label>
                <input
                  value={exchangeData.expectedHandling}
                  onChange={(e) => setExchangeData({ ...exchangeData, expectedHandling: e.target.value })}
                  placeholder="输入期望处理方式（必填）"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleExchange}
                disabled={!exchangeData.reason.trim() || !exchangeData.expectedHandling.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交申请
              </button>
              <button
                onClick={() => { setActiveForm(null); setExchangeData({ reason: '', expectedHandling: '' }) }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {relatedExchange && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-white mb-3">关联换货</h2>
            <Link
              to={`/exchanges/${relatedExchange.id}`}
              className="flex items-center justify-between bg-slate-800 rounded-xl border border-slate-700 p-4 hover:bg-slate-750 hover:border-blue-500/30 transition-colors"
            >
              <div>
                <p className="text-sm text-white">{warning.productName}</p>
                <p className="text-xs text-slate-400 mt-1">
                  换货原因：{relatedExchange.reason} · 期望处理：{relatedExchange.expectedHandling}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </Link>
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
