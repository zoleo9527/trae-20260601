import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, CornerDownLeft, Package, ExternalLink, Calendar } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { HandlerRole, Stage } from '@/types'

const roleStageActions: Record<string, { label: string; action: import('@/types').HandoffAction; icon: typeof Send; variant: 'primary' | 'danger' | 'secondary' }[]> = {
  'receptionist-reception': [
    { label: '提交给设计师', action: 'submit', icon: Send, variant: 'primary' },
    { label: '补材料', action: 'release_material', icon: Package, variant: 'secondary' },
  ],
  'designer-design': [
    { label: '提交给质检员', action: 'submit', icon: Send, variant: 'primary' },
  ],
  'inspector-qc': [
    { label: '放行至排产', action: 'submit', icon: Send, variant: 'primary' },
    { label: '打回设计师', action: 'reject', icon: CornerDownLeft, variant: 'danger' },
  ],
}

const roleLabels: Record<HandlerRole, string> = {
  receptionist: '接单客服',
  designer: '数字设计师',
  inspector: '质检员',
}

const stageLabels: Record<Stage, string> = {
  reception: '接单',
  design: '设计',
  qc: '质检',
  production: '排产',
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  blocked: '已阻塞',
  completed: '已完成',
}

export default function HandoffPanel() {
  const navigate = useNavigate()
  const selectedOrderId = useAppStore((s) => s.selectedOrderId)
  const orders = useAppStore((s) => s.orders)
  const currentRole = useAppStore((s) => s.currentRole)
  const showHandoffPanel = useAppStore((s) => s.showHandoffPanel)
  const toggleHandoffPanel = useAppStore((s) => s.toggleHandoffPanel)
  const submitHandoffAction = useAppStore((s) => s.submitHandoffAction)
  const loading = useAppStore((s) => s.loading)

  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const order = orders.find((o) => o.id === selectedOrderId)

  if (!showHandoffPanel || !order) return null

  const actionKey = `${currentRole}-${order.currentStage}`
  const actions = roleStageActions[actionKey] ?? []

  const hasMissingMaterials = order.missingMaterials.length > 0

  const handleSubmit = async (action: import('@/types').HandoffAction) => {
    if (!reason.trim()) {
      setError('请填写交接原因')
      return
    }
    setError('')
    await submitHandoffAction(order.id, { action, reason: reason.trim() })
    setReason('')
  }

  const filteredActions = actions.filter(
    (a) => !(a.action === 'release_material' && !hasMissingMaterials)
  )

  return (
    <div className="w-[360px] h-full bg-factory-surface border-l border-factory-border animate-slide-in flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-factory-border">
        <h3 className="text-sm font-semibold text-gray-200">交接操作</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (order) useAppStore.getState().setProductionBoardFocusDate(order.deliveryDate) }}
            className="p-1 text-factory-muted hover:text-factory-amber transition"
            title="查看排产位置"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => { if (order) navigate(`/order/${order.id}`) }}
            className="p-1 text-factory-muted hover:text-factory-amber transition"
            title="查看完整交接记录"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={toggleHandoffPanel}
            className="p-1 text-factory-muted hover:text-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-factory-border">
        <div className="mb-2">
          <span className="font-mono text-sm text-factory-amber">{order.orderNo}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-factory-muted">客户：</span>
            <span className="text-gray-300">{order.customerName}</span>
          </div>
          <div>
            <span className="text-factory-muted">患者：</span>
            <span className="text-gray-300">{order.patientName}</span>
          </div>
          <div>
            <span className="text-factory-muted">产品：</span>
            <span className="text-gray-300">{order.productType}</span>
          </div>
          <div>
            <span className="text-factory-muted">状态：</span>
            <span className="text-gray-300">{statusLabels[order.status]}</span>
          </div>
          <div>
            <span className="text-factory-muted">当前阶段：</span>
            <span className="text-gray-300">{stageLabels[order.currentStage]}</span>
          </div>
          <div>
            <span className="text-factory-muted">当前处理：</span>
            <span className="text-gray-300">{roleLabels[order.currentHandler]}</span>
          </div>
        </div>

        {hasMissingMaterials && (
          <div className="mt-3 p-2 bg-factory-red/10 border border-factory-red/30 rounded-md">
            <p className="text-xs text-factory-red font-medium">缺少材料：</p>
            <p className="text-xs text-factory-red/80 mt-0.5">{order.missingMaterials.join('、')}</p>
          </div>
        )}
      </div>

      <div className="p-4 flex-1">
        <label className="block text-xs text-factory-muted mb-1">交接原因 *</label>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError('') }}
          placeholder="请填写交接原因..."
          rows={4}
          className="w-full bg-factory-bg border border-factory-border rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-factory-muted focus:outline-none focus:border-factory-amber transition resize-none"
        />
        {error && <p className="text-xs text-factory-red mt-1">{error}</p>}
      </div>

      <div className="p-4 border-t border-factory-border flex flex-col gap-2">
        {filteredActions.map((act) => {
          const Icon = act.icon
          const btnClass =
            act.variant === 'primary'
              ? 'bg-factory-amber hover:bg-factory-amber/90 text-factory-bg font-medium'
              : act.variant === 'danger'
                ? 'border border-factory-red text-factory-red hover:bg-factory-red/10'
                : 'border border-factory-border text-gray-300 hover:border-factory-amber hover:text-factory-amber'
          return (
            <button
              key={act.action}
              onClick={() => handleSubmit(act.action)}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm transition disabled:opacity-50 ${btnClass}`}
            >
              <Icon className="w-4 h-4" />
              {act.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
