#!/bin/zsh
set -o noglob
cat > src/components/BatchActions.tsx << 'ENDOFFILE'
import { batchCheckin, batchReview, type BatchError } from '@/api/client'
import { useStore } from '@/store'
import { AlertCircle, CheckCircle, Loader2, X, XCircle } from 'lucide-react'
import { useState } from 'react'

interface BatchActionsProps {
  onRefresh: () => void
}

export default function BatchActions({ onRefresh }: BatchActionsProps) {
  const { currentRole, selectedIds, clearSelection, setSelectedIds } = useStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number>(0)
  const [errors, setErrors] = useState<BatchError[]>([])

  const hasResult = successCount > 0 || errors.length > 0

  if (selectedIds.length === 0 && !hasResult) return null

  const handleBatchCheckin = async () => {
    setLoading('checkin')
    setErrors([])
    try {
      const res = await batchCheckin(selectedIds)
      const checkedIn = res.checkedIn || []
      const errs = res.errors || []
      setSuccessCount(checkedIn.length)
      setErrors(errs)
      const failedIds = errs.map((e) => e.id)
      setSelectedIds(failedIds)
      onRefresh()
    } catch {
      setErrors(selectedIds.map((id) => ({ id, reason: '网络错误，请重试' })))
    } finally {
      setLoading(null)
    }
  }

  const handleBatchReview = async () => {
    setLoading('review')
    setErrors([])
    try {
      const res = await batchReview(selectedIds, true)
      const reviewed = res.reviewed || []
      const errs = res.errors || []
      setSuccessCount(reviewed.length)
      setErrors(errs)
      const failedIds = errs.map((e) => e.id)
      setSelectedIds(failedIds)
      onRefresh()
    } catch {
      setErrors(selectedIds.map((id) => ({ id, reason: '网络错误，请重试' })))
    } finally {
      setLoading(null)
    }
  }

  const handleClearAll = () => {
    clearSelection()
    setErrors([])
    setSuccessCount(0)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700/50 bg-slate-900/95 px-6 py-3 shadow-xl backdrop-blur">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">
              已选择 <span className="font-semibold text-amber-400">{selectedIds.length}</span> 项
            </span>

            {successCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                <CheckCircle className="h-3.5 w-3.5" />
                成功 {successCount}
              </span>
            )}

            {errors.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/30">
                <XCircle className="h-3.5 w-3.5" />
                失败 {errors.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentRole === 'technician' && (
              <button
                onClick={handleBatchCheckin}
                disabled={loading !== null}
                className="flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'checkin' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    签到中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    批量签到
                  </>
                )}
              </button>
            )}

            {currentRole === 'supervisor' && (
              <button
                onClick={handleBatchReview}
                disabled={loading !== null}
                className="flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'review' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    审核中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    批量审核通过
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              清除
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-rose-500/30 bg-rose-500/5">
            <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4" />
              以下工单处理失败，请修正后重试
            </div>
            <div className="grid max-h-40 grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto px-4 py-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {errors.map((e) => (
                <div key={e.id} className="flex items-start gap-2 py-0.5">
                  <span className="shrink-0 font-mono text-slate-400">{e.id}</span>
                  <span className="text-slate-300">{e.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
ENDOFFILE
wc -l src/components/BatchActions.tsx
wc -c src/components/BatchActions.tsx
