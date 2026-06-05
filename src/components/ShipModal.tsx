import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useState } from 'react'

interface ShipModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (logisticsCompany: string, trackingNo: string) => void
}

export default function ShipModal({ isOpen, onClose, onSubmit }: ShipModalProps) {
  const [logisticsCompany, setLogisticsCompany] = useState('')
  const [trackingNo, setTrackingNo] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (logisticsCompany && trackingNo) {
      onSubmit(logisticsCompany, trackingNo)
      setLogisticsCompany('')
      setTrackingNo('')
    }
  }

  const isDisabled = !logisticsCompany || !trackingNo

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">确认发货</h3>
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
              物流公司
            </label>
            <input
              type="text"
              value={logisticsCompany}
              onChange={(e) => setLogisticsCompany(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="请输入物流公司名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              物流单号
            </label>
            <input
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="请输入物流单号"
              required
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
                isDisabled
                  ? 'bg-amber-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
              disabled={isDisabled}
            >
              确认发货
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
