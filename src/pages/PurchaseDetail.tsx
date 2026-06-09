import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Package, Truck, CheckCircle, AlertTriangle, X as XIcon,
  User, Clock, FileCheck, Link2, Pencil,
} from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PurchaseBadge, QualificationBadge } from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import EditPurchaseModal from '@/components/EditPurchaseModal'
import { useStore, roleConfig } from '@/store'
import type { Purchase, QualificationStatus, PurchaseStatus } from '@/types'

function formatAmount(n: number) {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PURCHASE_FLOW_STEPS = [
  { key: 'draft', label: '草稿', responsibleRole: '销售内勤', responsibleAction: '提交审核' },
  { key: 'pending_review', label: '主管审核', responsibleRole: '主管', responsibleAction: '审批/驳回' },
  { key: 'approved', label: '确认出库', responsibleRole: '仓库员', responsibleAction: '确认出库' },
  { key: 'confirmed_out', label: '发货', responsibleRole: '仓库员/售后', responsibleAction: '标记发货' },
  { key: 'shipped', label: '签收', responsibleRole: '售后专员', responsibleAction: '确认签收' },
  { key: 'completed', label: '完成', responsibleRole: '', responsibleAction: '' },
]

const STATUS_STEP_INDEX: Record<PurchaseStatus, number> = {
  draft: 0,
  pending_review: 1,
  approved: 2,
  confirmed_out: 3,
  shipped: 4,
  completed: 5,
  rejected: -1,
}

const qualWarningConfig: Record<string, { bg: string; text: string; icon: typeof AlertTriangle; message: string }> = {
  expiring_soon: {
    bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle,
    message: '关联资质即将到期，请注意续期',
  },
  pending: {
    bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock,
    message: '关联资质尚在审核中',
  },
  expired: {
    bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle,
    message: '关联资质已过期，采购流程被阻断',
  },
  rejected: {
    bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle,
    message: '关联资质已驳回，采购流程被阻断',
  },
}

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useStore()
  const [data, setData] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiGet<Purchase>(`/purchases/${id}`)
      setData(res)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      await apiPost(`/purchases/${id}/${action}`, note ? { note } : {})
      setNote('')
      fetchData()
    } catch {
      /* ignore */
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await apiPost(`/purchases/${id}/reject`, note ? { note } : {})
      setNote('')
      fetchData()
    } catch {
      /* ignore */
    }
    setActionLoading(false)
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">加载中...</div>
  if (!data) return <div className="py-12 text-center text-sm text-gray-400">采购单不存在</div>

  const role = session?.role
  const showQualWarning = data.qualification_status !== 'approved'

  const canSubmit = role === 'sales_clerk' && data.status === 'draft'
  const canEdit = role === 'sales_clerk' && data.status === 'draft'
  const canApprove = role === 'director' && data.status === 'pending_review'
  const canConfirmOut = role === 'warehouse' && data.status === 'approved'
  const canShip = role === 'warehouse' && data.status === 'confirmed_out'
  const canComplete = role === 'after_sales' && data.status === 'shipped'
  const hasAction = canSubmit || canApprove || canConfirmOut || canShip || canComplete

  const currentStepIdx = STATUS_STEP_INDEX[data.status] ?? -1
  const isRejected = data.status === 'rejected'
  const isQualBlocked = data.qualification_status === 'expired' || data.qualification_status === 'rejected'

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/purchases')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </button>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl font-bold text-gray-900">{data.request_no}</h1>
              <PurchaseBadge status={data.status} />
              {canEdit && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  编辑
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{data.customer_name}</p>
          </div>
          <span className="text-xl font-semibold text-gray-900">{formatAmount(data.total_amount)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-gray-400">创建人：</span>
            <span className="text-gray-700">{data.created_by}</span>
          </div>
          <div>
            <span className="text-gray-400">创建时间：</span>
            <span className="text-gray-700">{data.created_at?.slice(0, 10)}</span>
          </div>
          {data.reviewed_by && (
            <div>
              <span className="text-gray-400">审核人：</span>
              <span className="text-gray-700">{data.reviewed_by}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400">更新时间：</span>
            <span className="text-gray-700">{data.updated_at?.slice(0, 10)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">流程进度</h3>
        <div className="flex items-center">
          {PURCHASE_FLOW_STEPS.map((step, i) => {
            const isCompleted = !isRejected && i <= currentStepIdx
            const isCurrent = !isRejected && i === currentStepIdx
            const isFuture = !isRejected && i > currentStepIdx

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    isCompleted && !isCurrent && 'bg-emerald-500 text-white',
                    isCurrent && 'bg-amber-500 text-white ring-4 ring-amber-100',
                    isFuture && 'bg-gray-100 text-gray-400',
                    isRejected && i === 0 && 'bg-red-100 text-red-500',
                  )}>
                    {isCompleted && !isCurrent ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    'mt-1.5 text-[11px] font-medium',
                    isCurrent ? 'text-amber-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400',
                  )}>
                    {step.label}
                  </span>
                  {step.responsibleRole && (
                    <span className="text-[10px] text-gray-300">{step.responsibleRole}</span>
                  )}
                </div>
                {i < PURCHASE_FLOW_STEPS.length - 1 && (
                  <div className={cn(
                    'mx-1 h-0.5 w-8',
                    isCompleted && i < currentStepIdx ? 'bg-emerald-300' : 'bg-gray-200',
                  )} />
                )}
              </div>
            )
          })}
        </div>
        {isRejected && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <XIcon className="h-4 w-4" />
            <span>采购申请已被驳回，销售内勤需修改后重新提交</span>
          </div>
        )}
        {!isRejected && currentStepIdx >= 0 && currentStepIdx < PURCHASE_FLOW_STEPS.length && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <User className="h-4 w-4" />
            <span>当前节点：<strong>{PURCHASE_FLOW_STEPS[currentStepIdx].responsibleRole}</strong> · {PURCHASE_FLOW_STEPS[currentStepIdx].responsibleAction}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">关联客户资质</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QualificationBadge status={data.qualification_status} />
            <span className="text-sm text-gray-600">
              {isQualBlocked ? '资质异常' : data.qualification_status === 'expiring_soon' ? '资质即将到期' : data.qualification_status === 'pending' ? '资质审核中' : '资质正常'}
            </span>
          </div>
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            isQualBlocked ? 'bg-red-100 text-red-700' : data.qualification_status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
          )}>
            {isQualBlocked ? '阻断采购' : data.qualification_status === 'expiring_soon' ? '风险提示' : data.qualification_status === 'pending' ? '待确认' : '可正常采购'}
          </span>
        </div>
      </div>

      {showQualWarning && qualWarningConfig[data.qualification_status] && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-3',
            qualWarningConfig[data.qualification_status].bg,
            qualWarningConfig[data.qualification_status].text,
          )}
        >
          {(() => {
            const Icon = qualWarningConfig[data.qualification_status].icon
            return <Icon className="h-5 w-5 shrink-0" />
          })()}
          <span className="text-sm font-medium">
            {qualWarningConfig[data.qualification_status].message}
          </span>
        </div>
      )}

      {data.items && data.items.length > 0 && (
        <div className="rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-400">
                <th className="px-4 py-3 font-medium">产品名称</th>
                <th className="px-4 py-3 font-medium">规格</th>
                <th className="px-4 py-3 font-medium text-right">数量</th>
                <th className="px-4 py-3 font-medium text-right">单价</th>
                <th className="px-4 py-3 font-medium text-right">小计</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{item.product_name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.specification || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatAmount(item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasAction && (
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="请输入备注信息（选填）"
            />
          </div>
          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={() => handleAction('submit')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                提交审核
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-40"
                >
                  <CheckCircle className="h-4 w-4" />
                  审核通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  <XIcon className="h-4 w-4" />
                  驳回
                </button>
              </>
            )}
            {canConfirmOut && (
              <button
                onClick={() => handleAction('confirm-out')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm text-white hover:bg-teal-600 disabled:opacity-40"
              >
                <Package className="h-4 w-4" />
                确认出库
              </button>
            )}
            {canShip && (
              <button
                onClick={() => handleAction('ship')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-600 disabled:opacity-40"
              >
                <Truck className="h-4 w-4" />
                标记发货
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => handleAction('complete')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                <CheckCircle className="h-4 w-4" />
                确认签收
              </button>
            )}
          </div>
        </div>
      )}

      {data.logs && data.logs.length > 0 && (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">操作记录</h3>
          <Timeline entries={data.logs} />
        </div>
      )}

      {showEdit && data && (
        <EditPurchaseModal
          purchaseId={data.id}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchData() }}
        />
      )}
    </div>
  )
}
