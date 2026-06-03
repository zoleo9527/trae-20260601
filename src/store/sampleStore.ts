import { create } from 'zustand'
import type { SampleRecord, SampleNote, BatchTrace, FilterState, RecordStatus, TraceStage } from '@/types'
import { mockRecords, mockNotes, mockTraces } from '@/data/mockData'

type ExceptionType = 'rush' | 'allergen' | 'receiving' | 'other'

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

  confirmSampling: (id: string, operator: string) => void
  completeSampling: (id: string, operator: string) => void
  markAsAbnormal: (id: string, reason: string, exceptionType: ExceptionType, operator: string, operatorRole: string) => void
  reprocessRecord: (id: string, operator: string, operatorRole: string) => void
  addNote: (recordId: string, author: string, role: string, content: string, type: SampleNote['type']) => void

  batchConfirmSampling: (ids: string[], operator: string) => void
  batchCompleteSampling: (ids: string[], operator: string) => void
  batchMarkAsAbnormal: (ids: string[], reason: string, exceptionType: ExceptionType, operator: string, operatorRole: string) => void

  filteredRecords: () => SampleRecord[]
  getNotesForRecord: (recordId: string) => SampleNote[]
  getTracesForRecord: (recordId: string) => BatchTrace[]
  stats: () => { pending: number; sampling: number; completed: number; abnormal: number }
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function statusLabel(s: RecordStatus): string {
  const m: Record<RecordStatus, string> = {
    pending: '待处理',
    sampling: '留样中',
    completed: '已完成',
    abnormal: '异常',
  }
  return m[s]
}

function exceptionTypeLabel(t: ExceptionType): string {
  const m: Record<ExceptionType, string> = {
    rush: '临时加单',
    allergen: '过敏原漏标',
    receiving: '收货不清',
    other: '其他异常',
  }
  return m[t]
}

function createSystemNote(recordId: string, content: string): SampleNote {
  return {
    id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recordId,
    author: '系统',
    role: '系统',
    content,
    createdAt: now(),
    type: 'system',
  }
}

function createManualNote(recordId: string, author: string, role: string, content: string): SampleNote {
  return {
    id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recordId,
    author,
    role,
    content,
    createdAt: now(),
    type: 'manual',
  }
}

function createExceptionNote(recordId: string, author: string, role: string, content: string): SampleNote {
  return {
    id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recordId,
    author,
    role,
    content,
    createdAt: now(),
    type: 'exception',
  }
}

function updateOrCreateTraceNode(
  traces: BatchTrace[],
  recordId: string,
  stage: TraceStage,
  updates: Partial<BatchTrace>
): BatchTrace[] {
  const existingIndex = traces.findIndex((t) => t.recordId === recordId && t.stage === stage)
  const timestamp = now()

  if (existingIndex >= 0) {
    return traces.map((t, i) =>
      i === existingIndex
        ? { ...t, ...updates, timestamp: updates.timestamp || timestamp }
        : t
    )
  }

  return [
    ...traces,
    {
      id: `T-${recordId}-${stage}-${Date.now()}`,
      recordId,
      stage,
      operator: updates.operator || '',
      timestamp: updates.timestamp || timestamp,
      status: updates.status || 'normal',
      detail: updates.detail || '',
      ...updates,
    } as BatchTrace,
  ]
}

function updateRecordExceptionFlags(
  record: SampleRecord,
  exceptionType: ExceptionType
): SampleRecord {
  const updates: Partial<SampleRecord> = {}
  if (exceptionType === 'rush') updates.isRushOrder = true
  if (exceptionType === 'allergen') updates.allergenMissing = true
  if (exceptionType === 'receiving') updates.receivingUnclear = true
  return { ...record, ...updates }
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

  confirmSampling: (id, operator) =>
    set((s) => {
      const record = s.records.find((r) => r.id === id)
      if (!record || record.status !== 'pending') return {}

      const timestamp = now()
      const newStatus: RecordStatus = 'sampling'

      const newTraces = updateOrCreateTraceNode(s.traces, id, 'sampling', {
        operator: `品控员-${operator}`,
        timestamp,
        status: 'normal',
        detail: `留样确认，${record.sampleWeight}g，4℃冷藏保存，留样期 48h`,
      })

      const newNotes = [
        ...s.notes,
        createSystemNote(id, `状态变更为：${statusLabel(newStatus)}`),
        createManualNote(id, operator, '品控员', `确认留样，${record.sampleWeight}g，容器密封良好`),
      ]

      return {
        records: s.records.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
        traces: newTraces,
        notes: newNotes,
      }
    }),

  completeSampling: (id, operator) =>
    set((s) => {
      const record = s.records.find((r) => r.id === id)
      if (!record || record.status !== 'sampling') return {}

      const timestamp = now()
      const newStatus: RecordStatus = 'completed'
      let newTraces = [...s.traces]

      newTraces = updateOrCreateTraceNode(newTraces, id, 'sampling', {
        operator: `品控员-${operator}`,
        timestamp,
        status: 'normal',
        detail: `留样完成，${record.sampleWeight}g，留样期结束可处置`,
      })

      newTraces = updateOrCreateTraceNode(newTraces, id, 'dispatch', {
        operator: `配送组`,
        timestamp,
        status: 'normal',
        detail: `出餐配送至${record.store}，留样完成后出餐`,
      })

      newTraces = updateOrCreateTraceNode(newTraces, id, 'store_receiving', {
        operator: `${record.store}-收货`,
        timestamp,
        status: 'normal',
        detail: `门店已确认收货`,
      })

      const newNotes = [
        ...s.notes,
        createSystemNote(id, `状态变更为：${statusLabel(newStatus)}`),
        createManualNote(id, operator, '品控员', '留样周期正常结束，无异常，准予处置'),
      ]

      return {
        records: s.records.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
        traces: newTraces,
        notes: newNotes,
      }
    }),

  markAsAbnormal: (id, reason, exceptionType, operator, operatorRole) =>
    set((s) => {
      const record = s.records.find((r) => r.id === id)
      if (!record) return {}

      const timestamp = now()
      const newStatus: RecordStatus = 'abnormal'
      const exLabel = exceptionTypeLabel(exceptionType)

      let traceStage: TraceStage = 'sampling'
      if (exceptionType === 'receiving') traceStage = 'store_receiving'
      if (exceptionType === 'allergen') traceStage = 'production'
      if (exceptionType === 'rush') traceStage = 'production'

      const newTraces = updateOrCreateTraceNode(s.traces, id, traceStage, {
        operator: `${operatorRole}-${operator}`,
        timestamp,
        status: 'error',
        detail: `⚠ ${exLabel}：${reason}`,
      })

      const updatedRecord = updateRecordExceptionFlags(record, exceptionType)

      const newNotes = [
        ...s.notes,
        createSystemNote(id, `状态变更为：${statusLabel(newStatus)}`),
        createExceptionNote(id, operator, operatorRole, `【${exLabel}】${reason}`),
      ]

      return {
        records: s.records.map((r) => (r.id === id ? { ...updatedRecord, status: newStatus } : r)),
        traces: newTraces,
        notes: newNotes,
      }
    }),

  reprocessRecord: (id, operator, operatorRole) =>
    set((s) => {
      const record = s.records.find((r) => r.id === id)
      if (!record || record.status !== 'abnormal') return {}

      const timestamp = now()
      const newStatus: RecordStatus = 'pending'
      let newTraces = [...s.traces]

      if (record.allergenMissing) {
        newTraces = updateOrCreateTraceNode(newTraces, id, 'production', {
          operator: `${operatorRole}-${operator}`,
          timestamp,
          status: 'warning',
          detail: '过敏原标识已补全，异常已处理，重新进入留样流程',
        })
      }
      if (record.receivingUnclear) {
        newTraces = updateOrCreateTraceNode(newTraces, id, 'store_receiving', {
          operator: `${operatorRole}-${operator}`,
          timestamp,
          status: 'warning',
          detail: '收货问题已核实澄清，异常已处理，重新进入留样流程',
        })
      }
      if (record.isRushOrder && !record.allergenMissing && !record.receivingUnclear) {
        newTraces = updateOrCreateTraceNode(newTraces, id, 'production', {
          operator: `${operatorRole}-${operator}`,
          timestamp,
          status: 'warning',
          detail: '临时加单已核实，异常已处理，重新进入留样流程',
        })
      }

      newTraces = updateOrCreateTraceNode(newTraces, id, 'sampling', {
        operator: `${operatorRole}-${operator}`,
        timestamp,
        status: 'warning',
        detail: '异常已处理，重新进入留样流程',
      })

      const newNotes = [
        ...s.notes,
        createSystemNote(id, `状态变更为：${statusLabel(newStatus)}（异常已处理，重新流转）`),
        createManualNote(id, operator, operatorRole, '异常已核实处理，重新进入留样流程'),
      ]

      return {
        records: s.records.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
        traces: newTraces,
        notes: newNotes,
      }
    }),

  addNote: (recordId, author, role, content, type) =>
    set((s) => ({
      notes: [
        ...s.notes,
        {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          recordId,
          author,
          role,
          content,
          createdAt: now(),
          type,
        },
      ],
    })),

  batchConfirmSampling: (ids, operator) =>
    set((s) => {
      const timestamp = now()
      let newTraces = [...s.traces]
      const newNotes: SampleNote[] = []
      const processedIds: string[] = []

      ids.forEach((id) => {
        const record = s.records.find((r) => r.id === id)
        if (!record || record.status !== 'pending') return

        processedIds.push(id)
        newTraces = updateOrCreateTraceNode(newTraces, id, 'sampling', {
          operator: `品控员-${operator}`,
          timestamp,
          status: 'normal',
          detail: `批量留样确认，${record.sampleWeight}g，4℃冷藏保存`,
        })
        newNotes.push(
          createSystemNote(id, `批量操作：状态变更为 ${statusLabel('sampling')}`),
          createManualNote(id, operator, '品控员', `批量确认留样，${record.sampleWeight}g`)
        )
      })

      if (processedIds.length === 0) return {}

      return {
        records: s.records.map((r) =>
          processedIds.includes(r.id) ? { ...r, status: 'sampling' } : r
        ),
        traces: newTraces,
        notes: [...s.notes, ...newNotes],
        selectedIds: [],
      }
    }),

  batchCompleteSampling: (ids, operator) =>
    set((s) => {
      const timestamp = now()
      let newTraces = [...s.traces]
      const newNotes: SampleNote[] = []
      const processedIds: string[] = []

      ids.forEach((id) => {
        const record = s.records.find((r) => r.id === id)
        if (!record || record.status !== 'sampling') return

        processedIds.push(id)
        newTraces = updateOrCreateTraceNode(newTraces, id, 'sampling', {
          operator: `品控员-${operator}`,
          timestamp,
          status: 'normal',
          detail: `批量留样完成，${record.sampleWeight}g，准予处置`,
        })
        newTraces = updateOrCreateTraceNode(newTraces, id, 'dispatch', {
          operator: `配送组`,
          timestamp,
          status: 'normal',
          detail: `出餐配送至${record.store}，留样完成后出餐`,
        })
        newTraces = updateOrCreateTraceNode(newTraces, id, 'store_receiving', {
          operator: `${record.store}-收货`,
          timestamp,
          status: 'normal',
          detail: `门店已确认收货`,
        })
        newNotes.push(
          createSystemNote(id, `批量操作：状态变更为 ${statusLabel('completed')}`),
          createManualNote(id, operator, '品控员', '批量完成留样，无异常')
        )
      })

      if (processedIds.length === 0) return {}

      return {
        records: s.records.map((r) =>
          processedIds.includes(r.id) ? { ...r, status: 'completed' } : r
        ),
        traces: newTraces,
        notes: [...s.notes, ...newNotes],
        selectedIds: [],
      }
    }),

  batchMarkAsAbnormal: (ids, reason, exceptionType, operator, operatorRole) =>
    set((s) => {
      const timestamp = now()
      let newTraces = [...s.traces]
      const newNotes: SampleNote[] = []
      const processedIds: string[] = []
      const exLabel = exceptionTypeLabel(exceptionType)

      let traceStage: TraceStage = 'sampling'
      if (exceptionType === 'receiving') traceStage = 'store_receiving'
      if (exceptionType === 'allergen') traceStage = 'production'
      if (exceptionType === 'rush') traceStage = 'production'

      ids.forEach((id) => {
        const record = s.records.find((r) => r.id === id)
        if (!record) return

        processedIds.push(id)
        newTraces = updateOrCreateTraceNode(newTraces, id, traceStage, {
          operator: `${operatorRole}-${operator}`,
          timestamp,
          status: 'error',
          detail: `⚠ 批量标注${exLabel}：${reason}`,
        })
        newNotes.push(
          createSystemNote(id, `批量操作：状态变更为 ${statusLabel('abnormal')}`),
          createExceptionNote(id, operator, operatorRole, `【批量${exLabel}】${reason}`)
        )
      })

      if (processedIds.length === 0) return {}

      return {
        records: s.records.map((r) => {
          if (!processedIds.includes(r.id)) return r
          const updated = updateRecordExceptionFlags(r, exceptionType)
          return { ...updated, status: 'abnormal' }
        }),
        traces: newTraces,
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
