import { create } from 'zustand'
import type { ProductionBatch, BatchStatus, BatchHistoryEntry, UserRole } from '@/types'
import { mockBatches } from '@/data/mock'

interface BatchState {
  batches: ProductionBatch[]
  selectedBatchId: string | null
  selectBatch: (id: string | null) => void
  transitionStatus: (
    batchId: string,
    toStatus: BatchStatus,
    operator: string,
    operatorRole: UserRole,
    remark: string
  ) => void
  getBatchesByStatus: (status: BatchStatus | 'all') => ProductionBatch[]
  getBatchById: (id: string) => ProductionBatch | undefined
}

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: mockBatches,
  selectedBatchId: null,
  selectBatch: (id) => set({ selectedBatchId: id }),
  transitionStatus: (batchId, toStatus, operator, operatorRole, remark) => {
    const now = new Date().toISOString()
    set((state) => ({
      batches: state.batches.map((batch) => {
        if (batch.id !== batchId) return batch
        const historyEntry: BatchHistoryEntry = {
          id: `bh-${Date.now()}`,
          batchId,
          fromStatus: batch.status,
          toStatus,
          operator,
          operatorRole,
          remark,
          timestamp: now,
        }
        return {
          ...batch,
          status: toStatus,
          updatedAt: now,
          lastModifiedBy: operator,
          history: [...batch.history, historyEntry],
        }
      }),
    }))
  },
  getBatchesByStatus: (status) => {
    const { batches } = get()
    if (status === 'all') return batches
    return batches.filter((b) => b.status === status)
  },
  getBatchById: (id) => {
    return get().batches.find((b) => b.id === id)
  },
}))
