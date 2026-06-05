import { X } from 'lucide-react'
import { useState } from 'react'

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (receiveRemark: string) => void
}

export default function ReceiveModal({ isOpen, onClose, onSubmit }: ReceiveModalProps) {
  const [receiveRemark, setReceiveRemark] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(receiveRemark)
    setReceiveRemark('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">确认签收</h3>
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
              签收备注
              <span className="text-stone-400 font-normal ml-1">(可选)</span>
            </label>
            <textarea
              value={receiveRemark}
              onChange={(e) => setReceiveRemark(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="请输入签收备注信息..."
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
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium transition-colors"
            >
              确认签收
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
