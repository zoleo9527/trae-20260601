import type { WarningActionType } from '@/types'
import { Bell, CheckCircle, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BatchActionBarProps {
  selectedCount: number
  onBatchAction: (actionType: WarningActionType) => void
  onClearSelection: () => void
}

export default function BatchActionBar({
  selectedCount,
  onBatchAction,
  onClearSelection,
}: BatchActionBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 bg-white border-t shadow-2xl transition-transform duration-300',
        selectedCount > 0 ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-700">
          已选择 <span className="font-semibold text-blue-600">{selectedCount}</span> 条
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onBatchAction('remind')}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            批量提醒
          </button>
          <button
            onClick={() => onBatchAction('confirm')}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            批量确认
          </button>
          <button
            onClick={() => onBatchAction('return')}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            批量退回
          </button>
        </div>

        <button
          onClick={onClearSelection}
          className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
