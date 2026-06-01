import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import type { RefundReason } from '@/types'
import { REFUND_REASON_LABELS } from '@/types'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'

export default function RefundModal() {
  const { showRefundModal, setShowRefundModal, refundTargetId, orders, requestRefund } =
    useOrderStore()
  const [selectedReason, setSelectedReason] = useState<RefundReason>('not_eating')
  const [confirmedServedRefund, setConfirmedServedRefund] = useState(false)

  const order = orders.find((o) => o.id === refundTargetId)
  const isServedRefund = order?.status === 'served' || order?.status === 'verified'

  if (!showRefundModal || !order) return null

  const handleSubmit = () => {
    if (isServedRefund && !confirmedServedRefund) return
    requestRefund(order.id, selectedReason)
    setConfirmedServedRefund(false)
    setSelectedReason('not_eating')
  }

  const handleClose = () => {
    setShowRefundModal(false)
    setConfirmedServedRefund(false)
    setSelectedReason('not_eating')
  }

  const reasons: RefundReason[] = ['not_eating', 'hospital', 'family_cancel', 'other']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[400px]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <RotateCcw size={18} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-stone-800">临时退餐</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <p className="text-sm font-semibold text-stone-700">{order.elderName}</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {order.dishName} · {order.deliveryAddress}
            </p>
          </div>

          {isServedRefund && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
                <AlertTriangle size={14} />
                注意：该订单已出餐
              </div>
              <p className="text-xs text-amber-600">
                餐品已制作/送出，退餐可能涉及费用结算问题，请确认已与老人或家属沟通。
              </p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedServedRefund}
                  onChange={(e) => setConfirmedServedRefund(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400 accent-amber-500"
                />
                <span className="text-xs text-amber-700 font-medium">
                  我已确认，继续退餐
                </span>
              </label>
            </div>
          )}

          <p className="text-xs font-semibold text-stone-500 mb-2.5">退餐原因</p>
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label
                key={reason}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedReason === reason
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
              >
                <input
                  type="radio"
                  name="refundReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-400 accent-orange-500"
                />
                <span className="text-sm text-stone-700">{REFUND_REASON_LABELS[reason]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isServedRefund && !confirmedServedRefund}
            className="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认退餐
          </button>
        </div>
      </div>
    </div>
  )
}
