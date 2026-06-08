import { useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { DamageStatus } from '@/types'

const statusOptions: { value: DamageStatus; label: string; desc: string }[] = [
  { value: '待处理', label: '待处理', desc: '尚未开始处理' },
  { value: '处理中', label: '处理中', desc: '正在处理中' },
  { value: '待认定', label: '待认定', desc: '处理完成，等待责任认定' },
  { value: '已认定', label: '已认定', desc: '责任已认定' },
  { value: '已关闭', label: '已关闭', desc: '事项已关闭' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (status: DamageStatus) => void
  currentStatus: DamageStatus
}

export default function UpdateDamageStatusModal({ open, onClose, onSubmit, currentStatus }: Props) {
  const [selected, setSelected] = useState<DamageStatus>(currentStatus)

  if (!open) return null

  const changed = selected !== currentStatus

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="text-base font-semibold text-surface-900">更新处理状态</h2>
          <button className="p-1 rounded-lg hover:bg-surface-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-2">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                  selected === opt.value
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-surface-200 hover:bg-surface-50'
                )}
              >
                <div className={clsx(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  selected === opt.value ? 'border-brand-600' : 'border-surface-300'
                )}>
                  {selected === opt.value && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-800">{opt.label}</div>
                  <div className="text-xs text-surface-400">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50 rounded-b-xl">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className={clsx('btn-primary', !changed && 'opacity-50 pointer-events-none')}
            onClick={() => changed && onSubmit(selected)}
          >
            确认更新
          </button>
        </div>
      </div>
    </div>
  )
}
