import { create } from 'zustand'
import type { QualitySample, SampleStatus, SampleHistoryEntry, UserRole } from '@/types'
import { mockSamples } from '@/data/mock'

interface SampleState {
  samples: QualitySample[]
  selectedSampleId: string | null
  selectSample: (id: string | null) => void
  createSample: (
    batchId: string,
    batchNo: string,
    operator: string,
    operatorRole: UserRole
  ) => QualitySample
  transitionStatus: (
    sampleId: string,
    toStatus: SampleStatus,
    operator: string,
    operatorRole: UserRole,
    remark: string
  ) => void
  getSamplesByStatus: (status: SampleStatus | 'all') => QualitySample[]
  getSampleById: (id: string) => QualitySample | undefined
  getActiveSampleByBatchId: (batchId: string) => QualitySample | undefined
}

export const useSampleStore = create<SampleState>((set, get) => ({
  samples: mockSamples,
  selectedSampleId: null,
  selectSample: (id) => set({ selectedSampleId: id }),
  createSample: (batchId, batchNo, operator, operatorRole) => {
    const now = new Date().toISOString()
    const dateStr = now.slice(0, 10).replace(/-/g, '')
    const existingCount = get().samples.filter(
      (s) => s.createdAt.slice(0, 10) === now.slice(0, 10)
    ).length
    const seq = String(existingCount + 1).padStart(3, '0')
    const sampleNo = `QC-${dateStr}-${seq}`
    const sampleId = `s-${Date.now()}`
    const historyEntry: SampleHistoryEntry = {
      id: `sh-${Date.now()}`,
      sampleId,
      fromStatus: null,
      toStatus: 'pending_sample',
      operator,
      operatorRole,
      remark: '批次提交质检，自动创建取样任务',
      timestamp: now,
    }
    const newSample: QualitySample = {
      id: sampleId,
      sampleNo,
      batchId,
      batchNo,
      status: 'pending_sample',
      indicators: {},
      createdBy: operator,
      tester: null,
      testedAt: null,
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: operator,
      history: [historyEntry],
      retentionExpiry: null,
    }
    set((state) => ({ samples: [...state.samples, newSample] }))
    return newSample
  },
  transitionStatus: (sampleId, toStatus, operator, operatorRole, remark) => {
    const now = new Date().toISOString()
    const isTestingTransition = toStatus === 'testing' || toStatus === 'qualified' || toStatus === 'unqualified'
    set((state) => ({
      samples: state.samples.map((sample) => {
        if (sample.id !== sampleId) return sample
        const historyEntry: SampleHistoryEntry = {
          id: `sh-${Date.now()}`,
          sampleId,
          fromStatus: sample.status,
          toStatus,
          operator,
          operatorRole,
          remark,
          timestamp: now,
        }
        return {
          ...sample,
          status: toStatus,
          tester: isTestingTransition ? operator : sample.tester,
          testedAt: isTestingTransition ? now : sample.testedAt,
          updatedAt: now,
          lastModifiedBy: operator,
          history: [...sample.history, historyEntry],
        }
      }),
    }))
  },
  getSamplesByStatus: (status) => {
    const { samples } = get()
    if (status === 'all') return samples
    return samples.filter((s) => s.status === status)
  },
  getSampleById: (id) => {
    return get().samples.find((s) => s.id === id)
  },
  getActiveSampleByBatchId: (batchId) => {
    const active = get().samples.filter(
      (s) => s.batchId === batchId && s.status !== 'destroyed'
    )
    if (active.length === 0) return undefined
    return active.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  },
}))
