import { useState } from 'react'
import type { BatchStatus } from '@/types'
import { BATCH_STATUS_MAP, BATCH_STATUS_ORDER, ROLE_MAP } from '@/types'
import { cn } from '@/lib/utils'
import { useBatchStore } from '@/stores/batchStore'
import { useSampleStore } from '@/stores/sampleStore'
import { useUIStore } from '@/stores/uiStore'
import { useActivityStore } from '@/stores/activityStore'
import BatchCard from './BatchCard'

type FilterStatus = BatchStatus | 'all'

export default function BatchList() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const batches = useBatchStore((s) => s.batches)
  const getBatchesByStatus = useBatchStore((s) => s.getBatchesByStatus)
  const transitionStatus = useBatchStore((s) => s.transitionStatus)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const currentRole = useUIStore((s) => s.currentRole)
  const addActivity = useActivityStore((s) => s.addActivity)
  const samples = useSampleStore((s) => s.samples)

  const filteredBatches = filter === 'all' ? batches : getBatchesByStatus(filter)

  const statusCounts: Record<FilterStatus, number> = {
    all: batches.length,
    ...Object.fromEntries(
      BATCH_STATUS_ORDER.map((status) => [status, batches.filter((b) => b.status === status).length])
    ) as Record<BatchStatus, number>,
  }

  const handleAction = (batchId: string, action: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    if (action === 'view_sample') {
      const sample = samples.find((s) => s.batchId === batchId)
      if (sample) {
        openDetailPanel('sample', sample.id)
      }
      return
    }

    const statusMap: Record<string, BatchStatus> = {
      start_feed: 'in_production',
      submit_qc: 'pending_qc',
      re_qc: 'pending_qc',
    }

    const remarkMap: Record<string, string> = {
      start_feed: '开始投料',
      submit_qc: '提交质检',
      re_qc: '重新质检',
    }

    const toStatus = statusMap[action]
    const remark = remarkMap[action]
    if (!toStatus) return

    const operator = ROLE_MAP[currentRole].defaultOperator
    transitionStatus(batchId, toStatus, operator, currentRole, remark)
    addActivity({
      id: `act-${Date.now()}`,
      type: 'batch',
      action: remark,
      operator,
      operatorRole: currentRole,
      targetId: batchId,
      targetName: batch.batchNo,
      timestamp: new Date().toISOString(),
      priority: batch.status === 'abnormal' ? 'urgent' : 'normal',
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-900">生产批次</h1>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          全部 ({statusCounts.all})
        </button>
        {BATCH_STATUS_ORDER.map((status) => {
          const { label } = BATCH_STATUS_MAP[status]
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {label} ({statusCounts[status]})
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-lg mb-1">暂无批次</p>
            <p className="text-sm">当前筛选条件下没有匹配的批次</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch) => (
              <div key={batch.id} onClick={() => openDetailPanel('batch', batch.id)}>
                <BatchCard
                  batch={batch}
                  onAction={(action) => handleAction(batch.id, action)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
