import { useSampleStore } from '@/store/sampleStore'
import { CheckCircle2, AlertTriangle, RotateCcw, X } from 'lucide-react'

export default function BatchActions() {
  const selectedIds = useSampleStore((s) => s.selectedIds)
  const batchUpdateStatus = useSampleStore((s) => s.batchUpdateStatus)
  const clearSelection = useSampleStore((s) => s.clearSelection)

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-600 bg-slate-800/95 px-5 py-3 shadow-2xl backdrop-blur-sm animate-slide-up">
      <span className="text-sm font-medium text-slate-300">
        已选 <span className="font-mono text-sky-400">{selectedIds.length}</span> 条
      </span>
      <div className="h-5 w-px bg-slate-600" />
      <button
        onClick={() => batchUpdateStatus(selectedIds, 'sampling')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        批量留样
      </button>
      <button
        onClick={() => batchUpdateStatus(selectedIds, 'completed')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        批量完成
      </button>
      <button
        onClick={() => batchUpdateStatus(selectedIds, 'abnormal')}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        批量标注异常
      </button>
      <div className="h-5 w-px bg-slate-600" />
      <button
        onClick={clearSelection}
        className="text-slate-400 transition-colors hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
