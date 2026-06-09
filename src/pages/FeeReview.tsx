import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowRight, Link2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/hooks/useStore'
import StatusBadge from '@/components/StatusBadge'
import type { FeeRecord, FeeRecordWithReviews, OverstayRecord } from '@/shared/types'

const TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'reviewing', label: '审核中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'disputed', label: '争议中' },
]

const ACTION_LABELS: Record<string, string> = {
  submit_review: '提交复核',
  approve: '通过',
  reject: '驳回',
  dispute: '发起争议',
  adjust: '调整金额',
}

const ACTION_COLORS: Record<string, string> = {
  approve: 'border-l-emerald-500 bg-emerald-50',
  reject: 'border-l-red-500 bg-red-50',
  dispute: 'border-l-purple-500 bg-purple-50',
  adjust: 'border-l-blue-500 bg-blue-50',
  submit_review: 'border-l-gray-400 bg-gray-50',
}

const ACTION_DOT: Record<string, string> = {
  approve: 'bg-emerald-500',
  reject: 'bg-red-500',
  dispute: 'bg-purple-500',
  adjust: 'bg-blue-500',
  submit_review: 'bg-gray-400',
}

const ROLE_LABELS: Record<string, string> = {
  gate_operator: '闸口操作员',
  dispatcher: '调度员',
  customer_service: '客服专员',
}

const ROLE_COLORS: Record<string, string> = {
  gate_operator: 'bg-gray-100 text-gray-600',
  dispatcher: 'bg-blue-100 text-blue-600',
  customer_service: 'bg-orange-100 text-orange-600',
}

export default function FeeReview() {
  const { currentRole } = useAppStore()
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [overstays, setOverstays] = useState<OverstayRecord[]>([])
  const [activeTab, setActiveTab] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<FeeRecordWithReviews | null>(null)
  const [comment, setComment] = useState('')
  const [adjustedAmount, setAdjustedAmount] = useState('')
  const [showAdjust, setShowAdjust] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchFees = useCallback(async () => {
    try {
      const [feeData, overstayData] = await Promise.all([
        api.fees.list(),
        api.overstay.list(),
      ])
      setFees(feeData)
      setOverstays(overstayData)
    } catch {}
  }, [])

  useEffect(() => { fetchFees() }, [fetchFees])

  const fetchDetail = useCallback(async () => {
    if (!selectedId) return
    try { setDetail(await api.fees.get(selectedId)) } catch {}
  }, [selectedId])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleSubmit = async (action: string) => {
    if (!selectedId || submitting) return
    setSubmitting(true)
    try {
      const operatorName = ROLE_LABELS[currentRole]
      if (action === 'dispute') {
        await api.fees.dispute(selectedId, { operatorName, role: currentRole, comment })
      } else {
        const payload: any = { action, operatorName, role: currentRole, comment }
        if (action === 'adjust' && adjustedAmount) payload.adjustedAmount = Number(adjustedAmount)
        await api.fees.review(selectedId, payload)
      }
      setComment('')
      setAdjustedAmount('')
      setShowAdjust(false)
      await Promise.all([fetchDetail(), fetchFees()])
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = activeTab ? fees.filter(f => f.review_status === activeTab) : fees
  const sorted = [...filtered].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  const counts: Record<string, number> = {
    '': fees.length,
    pending: fees.filter(f => f.review_status === 'pending').length,
    reviewing: fees.filter(f => f.review_status === 'reviewing').length,
    approved: fees.filter(f => f.review_status === 'approved').length,
    rejected: fees.filter(f => f.review_status === 'rejected').length,
    disputed: fees.filter(f => f.review_status === 'disputed').length,
  }

  const getActions = () => {
    if (!detail) return []
    const s = detail.review_status
    const actions: { action: string; label: string; cls: string }[] = []
    if (currentRole === 'dispatcher' && s === 'pending')
      actions.push({ action: 'submit_review', label: '提交复核', cls: 'btn-primary text-sm' })
    if (currentRole === 'customer_service') {
      if (s === 'pending')
        actions.push({ action: 'submit_review', label: '提交复核', cls: 'btn-primary text-sm' })
      if (s === 'reviewing') {
        actions.push({ action: 'approve', label: '通过', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium' })
        actions.push({ action: 'reject', label: '驳回', cls: 'bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium' })
        actions.push({ action: 'adjust', label: '调整金额', cls: 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium' })
      }
      actions.push({ action: 'dispute', label: '发起争议', cls: 'bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium' })
    }
    return actions
  }

  const actions = getActions()

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      <div className="w-[60%] flex flex-col min-w-0">
        <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-port-orange text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.label} ({counts[tab.key] ?? 0})
            </button>
          ))}
        </div>
        <div className="card flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">箱号</th>
                <th className="px-4 py-3 font-medium">客户</th>
                <th className="px-4 py-3 font-medium">基础费</th>
                <th className="px-4 py-3 font-medium">超期费</th>
                <th className="px-4 py-3 font-medium">合计</th>
                <th className="px-4 py-3 font-medium">审核状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(fee => (
                <tr key={fee.id} onClick={() => setSelectedId(fee.id)}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer ${selectedId === fee.id ? 'bg-port-orange/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{fee.container_no}</td>
                  <td className="px-4 py-3">{fee.customer_name}</td>
                  <td className="px-4 py-3 text-right">{fee.base_fee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{fee.overstay_fee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium">{fee.total_fee.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={fee.review_status} type="fee" /></td>
                  <td className="px-4 py-3">
                    <button className="text-port-orange hover:text-port-orange-dark text-sm font-medium"
                      onClick={e => { e.stopPropagation(); setSelectedId(fee.id) }}>复核</button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无费用记录</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-[40%] flex flex-col min-w-0 overflow-y-auto">
        {!detail ? (
          <div className="card flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>请选择费用记录进行复核</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-sm text-gray-500">{detail.container_no}</span>
                  <h3 className="font-medium">{detail.customer_name}</h3>
                </div>
                <StatusBadge status={detail.review_status} type="fee" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">基础费</div>
                  <div className="font-medium">{detail.base_fee.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">超期费</div>
                  <div className="font-medium">{detail.overstay_fee.toLocaleString()}</div>
                </div>
                <div className="bg-port-orange/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-port-orange mb-1">合计</div>
                  <div className="font-bold text-port-orange">{detail.total_fee.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-medium mb-3">复核记录</h4>
              {detail.review_entries.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">暂无复核记录</p>
              ) : (
                <div>
                  {detail.review_entries.map((entry, i) => (
                    <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${ACTION_DOT[entry.action] || 'bg-gray-400'}`} />
                        {i < detail.review_entries.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className={`flex-1 border-l-2 pl-3 pb-1 rounded-r-lg ${ACTION_COLORS[entry.action] || 'border-l-gray-300 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm">{ACTION_LABELS[entry.action] || entry.action}</span>
                          <span className="text-xs text-gray-500">{entry.operator_name}</span>
                          <span className={`status-badge ${ROLE_COLORS[entry.role] || 'bg-gray-100 text-gray-600'} text-[10px]`}>
                            {ROLE_LABELS[entry.role] || entry.role}
                          </span>
                        </div>
                        {entry.comment && <p className="text-sm text-gray-600 mb-1">{entry.comment}</p>}
                        {entry.adjusted_amount != null && (
                          <p className="text-sm text-blue-600 font-medium">调整金额: ¥{entry.adjusted_amount.toLocaleString()}</p>
                        )}
                        <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {actions.length > 0 && (
              <div className="card p-4">
                <h4 className="font-medium mb-3">操作</h4>
                <textarea rows={2} placeholder="输入备注..." value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange mb-3" />
                {showAdjust && (
                  <div className="mb-3">
                    <input type="number" placeholder="输入调整后金额" value={adjustedAmount}
                      onChange={e => setAdjustedAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-port-orange/30 focus:border-port-orange" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map(a => (
                    <button key={a.action} disabled={submitting} className={a.cls}
                      onClick={() => { if (a.action === 'adjust') { setShowAdjust(!showAdjust); return } handleSubmit(a.action) }}>
                      {a.label}
                    </button>
                  ))}
                  {showAdjust && (
                    <button disabled={submitting} onClick={() => handleSubmit('adjust')}
                      className="btn-primary text-sm">确认调整</button>
                  )}
                </div>
              </div>
            )}

            {detail && (() => {
              const overstay = overstays.find(o => o.container_id === detail.container_id)
              return overstay ? (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-port-orange" />
                    <h4 className="font-medium">关联超期记录</h4>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">超期状态</span>
                    <StatusBadge status={overstay.status} type="overstay" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">超期天数：</span>
                      <span className="font-medium text-red-600">{overstay.overstay_days}天</span>
                    </div>
                    {overstay.notified_at && (
                      <div>
                        <span className="text-gray-500">通知时间：</span>
                        <span className="font-medium">{new Date(overstay.notified_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </div>
                  <Link to="/overstay" className="text-port-orange text-sm hover:underline mt-2 inline-flex items-center gap-1">
                    查看超期详情 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : null
            })()}

            <Link to={`/containers/${detail.container_id}`}
              className="card p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <span className="text-sm text-gray-600">查看箱号详情</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-port-orange transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
