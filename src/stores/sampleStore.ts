import { create } from 'zustand'
import type { QualitySample, SampleStatus, SampleHistoryEntry, UserRole } from '@/types'
import { mockSamples } from '@/data/mock'

interface SampleState {
  samples: QualitySample[]
  selectedSampleId: string | null
  selectSample: (id: string | null) => void
  transitionStatus: (
    sampleId: string,
    toStatus: SampleStatus,
    operator: string,
    operatorRole: UserRole,
    remark: string
  ) => void
  getSamplesByStatus: (status: SampleStatus | 'all') => QualitySample[]
  getSampleById: (id: string) => QualitySample | undefined
}

export const useSampleStore = create<SampleState>((set, get) => ({
  samples: mockSamples,
  selectedSampleId: null,
  selectSample: (id) => set({ selectedSampleId: id }),
  transitionStatus: (sampleId, toStatus, operator, operatorRole, remark) => {
    const now = new Date().toISOString()
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
          tester: operator,
          testedAt: now,
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
}))
