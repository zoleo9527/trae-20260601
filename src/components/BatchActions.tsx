import { batchCheckin, batchReview } from '@/api/client'
import { useStore } from '@/store'
import { CheckCircle, X } from 'lucide-react'

interface BatchActionsProps {
  onRefresh: () => void
}

export default function BatchActions({ onRefresh }: BatchActionsProps) {
  const { currentRole, selectedIds, clearSelection } = useStore()

  if (selectedIds.length === 0) return null

  const handleBatchCheckin = async () => {
    try {
      await batchCheckin(selectedIds)
      clearSelection()
      onRefresh()
    } catch {
      console.error('批量签到失败')
    }
  }

  const handleBatchReview = async () => {
    try {
      await batchReview(selectedIds, true)
      clearSelection()
      onRefresh()
    } catch {
      console.error('批量审核失败')
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-slate-900 px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-sm text-slate-300">
          已选择 <span className="font-semibold text-amber-400">{selectedIds.length}</span> 项
        </span>

        <div className="flex items-center gap-3">
          {currentRole === 'technician' && (
            <button
              onClick={handleBatchCheckin}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              批量签到
            </button>
          )}

          {currentRole === 'supervisor' && (
            <button
              onClick={handleBatchReview}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              批量审核通过
            </button>
          )}

          <button
            onClick={clearSelection}
            className="flex items-center gap-1 rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            清除
          </button>
        </div>
      </div>
    </div>
  )
}
