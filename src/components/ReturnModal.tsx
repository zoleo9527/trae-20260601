import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useState } from 'react'

interface ReturnModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string, remark: string) => void
}

const returnReasons = [
  { value: '库存不足', label: '库存不足' },
  { value: '生产问题', label: '生产问题' },
  { value: '包装问题', label: '包装问题' },
  { value: '物流问题', label: '物流问题' },
  { value: '其他', label: '其他' },
]

export default function ReturnModal({ isOpen, onClose, onSubmit }: ReturnModalProps) {
  const [reason, setReason] = useState('')
  const [remark, setRemark] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason) {
      onSubmit(reason, remark)
      setReason('')
      setRemark('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">退回订单</h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              退回原因
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              <option value="">请选择退回原因</option>
              {returnReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="请输入备注信息..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-md hover:bg-stone-200 font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={cn(
                'flex-1 px-4 py-2 text-white rounded-md font-medium transition-colors',
                reason
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-400 cursor-not-allowed'
              )}
              disabled={!reason}
            >
              确认退回
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
