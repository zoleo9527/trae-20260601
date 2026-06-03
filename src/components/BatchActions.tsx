import { useSampleStore } from '@/store/sampleStore'
import { useShallow } from 'zustand/shallow'
import { useState } from 'react'
import { CheckCircle2, AlertTriangle, FlaskConical, X, XCircle } from 'lucide-react'

type ExceptionType = 'rush' | 'allergen' | 'receiving' | 'other'

const exceptionTypeOptions: { value: ExceptionType; label: string }[] = [
  { value: 'rush', label: '临时加单' },
  { value: 'allergen', label: '过敏原漏标' },
  { value: 'receiving', label: '收货不清' },
  { value: 'other', label: '其他异常' },
]

const CURRENT_OPERATOR = '张伟'
const CURRENT_ROLE = '品控员'

export default function BatchActions() {
  const { selectedIds, batchConfirmSampling, batchCompleteSampling, batchMarkAsAbnormal, clearSelection } = useSampleStore(
    useShallow((s) => ({
      selectedIds: s.selectedIds,
      batchConfirmSampling: s.batchConfirmSampling,
      batchCompleteSampling: s.batchCompleteSampling,
      batchMarkAsAbnormal: s.batchMarkAsAbnormal,
      clearSelection: s.clearSelection,
    }))
  )

  const [showAbnormalDialog, setShowAbnormalDialog] = useState(false)
  const [abnormalReason, setAbnormalReason] = useState('')
  const [abnormalType, setAbnormalType] = useState<ExceptionType>('other')

  if (selectedIds.length === 0) return null

  const handleOpenAbnormalDialog = () => {
    setAbnormalType('other')
    setAbnormalReason('')
    setShowAbnormalDialog(true)
  }

  const handleConfirmAbnormal = () => {
    if (!abnormalReason.trim()) return
    batchMarkAsAbnormal(selectedIds, abnormalReason.trim(), abnormalType, CURRENT_OPERATOR, CURRENT_ROLE)
    setShowAbnormalDialog(false)
    setAbnormalReason('')
  }

  return (
    <>
      {showAbnormalDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAbnormalDialog(false)}
          />
          <div className="relative z-10 w-[420px] rounded-xl border border-slate-600 bg-slate-800 p-6 shadow-2xl animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                批量标注异常 <span className="text-sky-400">({selectedIds.length} 条)</span>
              </h3>
              <button
                onClick={() => setShowAbnormalDialog(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                异常类型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {exceptionTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAbnormalType(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      abnormalType === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                异常原因 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={abnormalReason}
                onChange={(e) => setAbnormalReason(e.target.value)}
                placeholder="请详细描述异常原因..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                异常原因将同步写入所有选中记录的批次追溯链和历史备注
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnormalDialog(false)}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAbnormal}
                disabled={!abnormalReason.trim()}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                确认标注
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-600 bg-slate-800/95 px-5 py-3 shadow-2xl backdrop-blur-sm animate-slide-up">
        <span className="text-sm font-medium text-slate-300">
          已选 <span className="font-mono text-sky-400">{selectedIds.length}</span> 条
        </span>
        <div className="h-5 w-px bg-slate-600" />
        <button
          onClick={() => batchConfirmSampling(selectedIds, CURRENT_OPERATOR)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          批量留样
        </button>
        <button
          onClick={() => batchCompleteSampling(selectedIds, CURRENT_OPERATOR)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          批量完成
        </button>
        <button
          onClick={handleOpenAbnormalDialog}
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
    </>
  )
}
