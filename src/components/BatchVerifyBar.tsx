import { cn } from '@/lib/utils'
import { useOrderStore } from '@/store/useOrderStore'
import { Check } from 'lucide-react'

export default function BatchVerifyBar() {
  const { selectedOrderIds, batchVerify, clearSelection } = useOrderStore()
  const count = selectedOrderIds.size

  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-64 right-96 z-50">
      <div className="mx-5 mb-4 bg-orange-600 rounded-xl shadow-lg shadow-orange-200/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Check size={18} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">
            已选 <span className="text-lg">{count}</span> 项
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearSelection}
            className="px-4 py-1.5 text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={batchVerify}
            className={cn(
              'px-5 py-1.5 text-sm font-bold rounded-lg transition-colors',
              'bg-white text-orange-600 hover:bg-orange-50'
            )}
          >
            批量核销
          </button>
        </div>
      </div>
    </div>
  )
}
