import { create } from 'zustand'
import type { SampleRecord, SampleNote, BatchTrace, FilterState, RecordStatus } from '@/types'
import { mockRecords, mockNotes, mockTraces } from '@/data/mockData'

interface SampleStore {
  records: SampleRecord[]
  notes: SampleNote[]
  traces: BatchTrace[]
  filters: FilterState
  selectedIds: string[]
  detailRecordId: string | null

  setFilters: (filters: Partial<FilterState>) => void
  toggleSelect: (id: string) => void
  toggleSelectAll: (ids: string[]) => void
  clearSelection: () => void
  openDetail: (id: string) => void
  closeDetail: () => void
  updateRecordStatus: (id: string, status: RecordStatus) => void
  addNote: (recordId: string, author: string, role: string, content: string, type: SampleNote['type']) => void
  batchUpdateStatus: (ids: string[], status: RecordStatus) => void
  filteredRecords: () => SampleRecord[]
  getNotesForRecord: (recordId: string) => SampleNote[]
  getTracesForRecord: (recordId: string) => BatchTrace[]
  stats: () => { pending: number; sampling: number; completed: number; abnormal: number }
}

export const useSampleStore = create<SampleStore>((set, get) => ({
  records: [...mockRecords],
  notes: [...mockNotes],
  traces: [...mockTraces],
  filters: {
    status: 'all',
    store: '',
    exceptionType: 'all',
    search: '',
  },
  selectedIds: [],
  detailRecordId: null,

  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),

  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),

  toggleSelectAll: (ids) =>
    set((s) => {
      const allSelected = ids.every((id) => s.selectedIds.includes(id))
      return {
        selectedIds: allSelected
          ? s.selectedIds.filter((x) => !ids.includes(x))
          : [...new Set([...s.selectedIds, ...ids])],
      }
    }),

  clearSelection: () => set({ selectedIds: [] }),

  openDetail: (id) => set({ detailRecordId: id }),
  closeDetail: () => set({ detailRecordId: null }),

  updateRecordStatus: (id, status) =>
    set((s) => ({
      records: s.records.map((r) => (r.id === id ? { ...r, status } : r)),
      notes: [
        ...s.notes,
        {
          id: `N-${Date.now()}`,
          recordId: id,
          author: '系统',
          role: '系统',
          content: `状态变更为：${statusLabel(status)}`,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          type: 'system' as const,
        },
      ],
    })),

  addNote: (recordId, author, role, content, type) =>
    set((s) => ({
      notes: [
        ...s.notes,
        {
          id: `N-${Date.now()}`,
          recordId,
          author,
          role,
          content,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          type,
        },
      ],
    })),

  batchUpdateStatus: (ids, status) =>
    set((s) => {
      const newNotes: SampleNote[] = ids.map((id) => ({
        id: `N-${Date.now()}-${id}`,
        recordId: id,
        author: '系统',
        role: '系统',
        content: `批量操作：状态变更为 ${statusLabel(status)}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: 'system' as const,
      }))
      return {
        records: s.records.map((r) =>
          ids.includes(r.id) ? { ...r, status } : r
        ),
        notes: [...s.notes, ...newNotes],
        selectedIds: [],
      }
    }),

  filteredRecords: () => {
    const { records, filters } = get()
    return records.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false
      if (filters.store && r.store !== filters.store) return false
      if (filters.exceptionType === 'rush' && !r.isRushOrder) return false
      if (filters.exceptionType === 'allergen' && !r.allergenMissing) return false
      if (filters.exceptionType === 'receiving' && !r.receivingUnclear) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          r.id.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.batchNo.toLowerCase().includes(q) ||
          r.store.toLowerCase().includes(q)
        )
      }
      return true
    })
  },

  getNotesForRecord: (recordId) => {
    return get().notes.filter((n) => n.recordId === recordId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  getTracesForRecord: (recordId) => {
    return get().traces.filter((t) => t.recordId === recordId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  },

  stats: () => {
    const { records } = get()
    return {
      pending: records.filter((r) => r.status === 'pending').length,
      sampling: records.filter((r) => r.status === 'sampling').length,
      completed: records.filter((r) => r.status === 'completed').length,
      abnormal: records.filter((r) => r.status === 'abnormal').length,
    }
  },
}))

function statusLabel(s: RecordStatus): string {
  const m: Record<RecordStatus, string> = {
    pending: '待处理',
    sampling: '留样中',
    completed: '已完成',
    abnormal: '异常',
  }
  return m[s]
}
