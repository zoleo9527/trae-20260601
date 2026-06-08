import { useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: { returnReason: string }) => void
}

export default function ReturnRedeterminationModal({ open, onClose, onSubmit }: Props) {
  const [returnReason, setReturnReason] = useState('')

  if (!open) return null

  const canSubmit = returnReason.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-semibold text-surface-900">退回重新认定</h2>
          </div>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800 leading-relaxed">
              退回后，该认定将标记为"已退回"状态，并出现在工作台的"被退回"分类中。请填写退回原因，以便后续重新认定时参考。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">退回原因 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              rows={4}
              placeholder="请详细说明退回原因，包括异议内容和需要补充的证据..."
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className={clsx('btn-primary', !canSubmit && 'opacity-50 pointer-events-none')}
            style={!canSubmit ? undefined : { backgroundColor: '#ea580c' }}
            onClick={() => canSubmit && onSubmit({ returnReason })}
          >
            确认退回
          </button>
        </div>
      </div>
    </div>
  )
}
