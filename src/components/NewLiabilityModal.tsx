import { X } from 'lucide-react'
import type { DamageCategory, DamageSeverity } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  awb: string
  flightNo: string
  category: DamageCategory
  severity: DamageSeverity
}

export default function NewLiabilityModal({ open, onClose, onSubmit, awb, flightNo, category, severity }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-base font-semibold text-surface-900">发起责任认定</h2>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              将基于当前货损记录创建责任认定，以下信息将自动带入：
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">运单号</span>
              <span className="font-mono font-semibold text-surface-800">{awb}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">航班号</span>
              <span className="font-mono font-semibold text-surface-800">{flightNo}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-100">
              <span className="text-surface-500">异常类别</span>
              <span className="font-medium text-surface-800">{category}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-500">严重程度</span>
              <span className="font-medium text-surface-800">{severity}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              提交后货损状态将切换为"待认定"，同时生成关联的责任认定记录。你可以在责任认定页面继续完善认定信息。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={onSubmit}>
            确认发起认定
          </button>
        </div>
      </div>
    </div>
  )
}
