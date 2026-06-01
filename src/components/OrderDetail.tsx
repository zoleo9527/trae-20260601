import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import type { Order } from '@/types'
import {
    MEAL_TYPE_LABELS,
    ORDER_STATUS_LABELS,
    REFUND_REASON_LABELS,
    STATUS_COLORS,
    SUBSIDY_COLORS,
    SUBSIDY_TYPE_LABELS,
    getRefundStatusColor,
    getRefundStatusLabel,
} from '@/types'
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    FileText,
    MapPin,
    Phone,
    RotateCcw,
    Tag,
    User,
    Utensils,
    XCircle
} from 'lucide-react'

function getStatusDisplay(order: Order) {
  if (order.status === 'refund_requested') {
    return {
      label: getRefundStatusLabel(order.statusBeforeRefund),
      color: getRefundStatusColor(order.statusBeforeRefund),
    }
  }
  return {
    label: ORDER_STATUS_LABELS[order.status],
    color: STATUS_COLORS[order.status],
  }
}

function StatusTimeline({ order }: { order: Order }) {
  const preRefundStatus = order.status === 'refund_requested'
    ? (order.statusBeforeRefund ?? 'pending')
    : order.status

  const steps = [
    { label: '下单成功', done: true, time: order.orderDate },
    {
      label: '已出餐',
      done: ['served', 'verified'].includes(preRefundStatus),
      time: ['served', 'verified'].includes(preRefundStatus) ? order.orderDate : '',
    },
    {
      label: '已核销',
      done: preRefundStatus === 'verified',
      time: order.verifiedAt ?? '',
    },
  ]

  const refundLabel = getRefundStatusLabel(order.statusBeforeRefund)

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                step.done ? 'bg-green-100' : 'bg-stone-100'
              )}
            >
              {step.done ? (
                <CheckCircle2 size={14} className="text-green-600" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-stone-300" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-px h-4', step.done ? 'bg-green-200' : 'bg-stone-200')} />
            )}
          </div>
          <div className="pt-0.5">
            <p className={cn('text-xs font-medium', step.done ? 'text-stone-700' : 'text-stone-400')}>
              {step.label}
            </p>
            {step.time && (
              <p className="text-[11px] text-stone-400 mt-0.5">{step.time}</p>
            )}
          </div>
        </div>
      ))}
      {order.status === 'refund_requested' && (
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100">
            <RotateCcw size={14} className="text-red-500" />
          </div>
          <div className="pt-0.5">
            <p className="text-xs font-medium text-red-600">{refundLabel}</p>
            {order.refundReason && (
              <p className="text-[11px] text-red-400 mt-0.5">
                原因：{REFUND_REASON_LABELS[order.refundReason]}
              </p>
            )}
            {order.isServedRefund && (
              <p className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
                <AlertTriangle size={10} />
                需确认退费方式
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderDetail() {
  const { orders, activeOrderId, setActiveOrder, cancelRefund, setShowRefundModal } = useOrderStore()
  const order = orders.find((o) => o.id === activeOrderId)

  if (!order) {
    return (
      <div className="w-96 border-l border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center text-stone-400">
        <BadgeCheck size={48} strokeWidth={1} className="text-stone-200 mb-3" />
        <p className="text-sm">点击左侧订单查看详情</p>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(order)
  const hasAbnormal = order.subsidyExpired || order.duplicateOrder || order.status === 'refund_requested'

  return (
    <div className="w-96 border-l border-stone-200 bg-white flex flex-col h-full">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-700">订单详情</h3>
        <button
          onClick={() => setActiveOrder(null)}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <XCircle size={18} />
        </button>
      </div>

      {hasAbnormal && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-red-700 text-xs font-semibold mb-1">
            <AlertTriangle size={14} />
            异常提示
          </div>
          <ul className="text-xs text-red-600 space-y-0.5">
            {order.subsidyExpired && <li>· 补贴资格已过期，请核实续期情况</li>}
            {order.duplicateOrder && <li>· 存在重复订餐，请确认是否为误操作</li>}
            {order.status === 'refund_requested' && (order.statusBeforeRefund === 'served' || order.statusBeforeRefund === 'verified') && (
              <li>· {getRefundStatusLabel(order.statusBeforeRefund)}，需确认退费方式</li>
            )}
            {order.status === 'refund_requested' && (order.statusBeforeRefund === 'pending' || !order.statusBeforeRefund) && (
              <li>· {getRefundStatusLabel(order.statusBeforeRefund)}</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User size={15} className="text-stone-400" />
            <span className="text-sm font-semibold text-stone-800">{order.elderName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-stone-400" />
            <span className="text-sm text-stone-600">{order.phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-stone-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-stone-600">{order.deliveryAddress}</span>
          </div>
        </div>

        <div className="h-px bg-stone-100" />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Utensils size={15} className="text-stone-400" />
            <span className="text-sm text-stone-700">
              {MEAL_TYPE_LABELS[order.mealType]} · {order.dishName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-stone-400" />
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                SUBSIDY_COLORS[order.subsidyType]
              )}
            >
              {SUBSIDY_TYPE_LABELS[order.subsidyType]}
            </span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                statusDisplay.color
              )}
            >
              {statusDisplay.label}
            </span>
          </div>
        </div>

        <div className="h-px bg-stone-100" />

        <div>
          <p className="text-xs font-semibold text-stone-500 mb-3">核销状态</p>
          <StatusTimeline order={order} />
        </div>

        {order.note && (
          <>
            <div className="h-px bg-stone-100" />
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText size={15} className="text-stone-400" />
                <p className="text-xs font-semibold text-stone-500">备注</p>
              </div>
              <p className="text-sm text-stone-600 pl-6">{order.note}</p>
            </div>
          </>
        )}
      </div>

      {order.status === 'refund_requested' ? (
        <div className="px-5 py-3 border-t border-stone-100">
          <button
            onClick={() => cancelRefund(order.id)}
            className="w-full py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
          >
            撤回退餐申请
          </button>
        </div>
      ) : (
        (order.status === 'served' || order.status === 'pending' || order.status === 'verified') && (
          <div className="px-5 py-3 border-t border-stone-100">
            <button
              onClick={() => setShowRefundModal(true, order.id)}
              className="w-full py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              申请退餐
            </button>
          </div>
        )
      )}
    </div>
  )
}
