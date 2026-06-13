import { create } from 'zustand'
import type { OperationRecord, TodoItem, FilterState, Role, RecordStatus, TimelineAction, TimelineEntry } from '@/types'
import { mockRecords, mockTodos } from '@/data/mockData'

function computeRecordStatus(record: OperationRecord): OperationRecord {
  const { settlement, reconciliation } = record
  let newStatus: RecordStatus = 'normal'

  if (settlement.status === 'disputed' || reconciliation.status === 'disputed') {
    newStatus = 'disputed'
  } else if (settlement.status === 'returned' || reconciliation.status === 'discrepancy') {
    newStatus = 'returned'
  } else if (
    record.recordStatus === 'overdue' &&
    (settlement.status === 'pending' || reconciliation.status === 'pending')
  ) {
    newStatus = 'overdue'
  }

  return { ...record, recordStatus: newStatus }
}

const OPERATOR_BY_ROLE: Record<Role, string> = {
  recruiter: '招聘专员-陈磊',
  onsite: '驻场主管-周军',
  payroll: '薪酬会计-刘芳',
}

function buildTimelineEntry(action: TimelineAction, role: Role, note?: string): TimelineEntry {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  return {
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    role,
    operator: OPERATOR_BY_ROLE[role],
    note,
    timestamp,
  }
}

interface WorkbenchStore {
  records: OperationRecord[]
  todos: TodoItem[]
  currentRole: Role
  filters: FilterState
  selectedRecordId: string | null
  activeTab: 'todos' | 'settlement' | 'reconciliation'

  setCurrentRole: (role: Role) => void
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  selectRecord: (id: string | null) => void
  setActiveTab: (tab: 'todos' | 'settlement' | 'reconciliation') => void
  markTodoRead: (id: string) => void
  updateSettlementStatus: (recordId: string, status: OperationRecord['settlement']['status'], note?: string) => void
  updateReconciliationStatus: (recordId: string, status: OperationRecord['reconciliation']['status'], note?: string) => void
  recomputeRecordStatus: (recordId: string) => void
  addSupplementNote: (recordId: string, note: string) => void
  addReturnReason: (recordId: string, reason: string) => void

  getFilteredRecords: () => OperationRecord[]
  getRoleTodos: () => TodoItem[]
  getStatsByRole: () => { total: number; pending: number; overdue: number; disputed: number }
}

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  role: 'all',
  period: '',
  clientName: '',
}

const SETTLEMENT_ACTION_MAP: Record<string, TimelineAction> = {
  processing: 'settlement_processing',
  confirmed: 'settlement_confirmed',
  returned: 'settlement_returned',
  disputed: 'settlement_disputed',
}

const RECONCILIATION_ACTION_MAP: Record<string, TimelineAction> = {
  sent: 'reconciliation_sent',
  confirmed: 'reconciliation_confirmed',
  discrepancy: 'reconciliation_discrepancy',
  disputed: 'reconciliation_disputed',
}

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  records: mockRecords,
  todos: mockTodos,
  currentRole: 'recruiter',
  filters: defaultFilters,
  selectedRecordId: null,
  activeTab: 'todos',

  setCurrentRole: (role) => set({ currentRole: role, selectedRecordId: null }),
  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: defaultFilters }),
  selectRecord: (id) => set({ selectedRecordId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  markTodoRead: (id) =>
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, isRead: true } : t)),
    })),

  updateSettlementStatus: (recordId, status, note) =>
    set((s) => {
      const { currentRole } = s
      const records = s.records.map((r) => {
        if (r.id !== recordId) return r
        const isReturned = status === 'returned'
        const isDisputed = status === 'disputed'
        const newSettlement = {
          ...r.settlement,
          status,
          ...(note && isReturned ? { returnedReason: note } : {}),
          ...(note && !isReturned ? { supplementNote: note } : {}),
          ...(status === 'processing' ? { processedAt: new Date().toISOString().slice(0, 10) } : {}),
        }
        const action = SETTLEMENT_ACTION_MAP[status]
        const newTimeline = action
          ? [...r.timeline, buildTimelineEntry(action, currentRole, note)]
          : r.timeline
        const newRecord = {
          ...r,
          settlement: newSettlement,
          timeline: newTimeline,
          returnedReason: isReturned && note ? note : r.returnedReason,
          disputeDetail: isDisputed && note ? note : r.disputeDetail,
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        return computeRecordStatus(newRecord)
      })
      return { records }
    }),

  updateReconciliationStatus: (recordId, status, note) =>
    set((s) => {
      const { currentRole } = s
      const records = s.records.map((r) => {
        if (r.id !== recordId) return r
        const isDiscrepancy = status === 'discrepancy'
        const isDisputed = status === 'disputed'
        const newReconciliation = {
          ...r.reconciliation,
          status,
          ...(note && isDiscrepancy ? { discrepancyNote: note } : {}),
          ...(status === 'sent' ? { sentAt: new Date().toISOString().slice(0, 10) } : {}),
          ...(status === 'confirmed' ? { confirmedAt: new Date().toISOString().slice(0, 10) } : {}),
        }
        const action = RECONCILIATION_ACTION_MAP[status]
        const newTimeline = action
          ? [...r.timeline, buildTimelineEntry(action, currentRole, note)]
          : r.timeline
        const newRecord = {
          ...r,
          reconciliation: newReconciliation,
          timeline: newTimeline,
          returnedReason: isDiscrepancy && note ? note : r.returnedReason,
          disputeDetail: isDisputed && note ? note : r.disputeDetail,
          updatedAt: new Date().toISOString().slice(0, 10),
        }
        return computeRecordStatus(newRecord)
      })
      return { records }
    }),

  recomputeRecordStatus: (recordId) =>
    set((s) => ({
      records: s.records.map((r) => (r.id === recordId ? computeRecordStatus(r) : r)),
    })),

  addSupplementNote: (recordId, note) =>
    set((s) => {
      const { currentRole } = s
      const records = s.records.map((r) => {
        if (r.id !== recordId) return r
        return {
          ...r,
          supplementNote: note,
          timeline: [...r.timeline, buildTimelineEntry('supplement_added', currentRole, note)],
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      })
      return { records }
    }),

  addReturnReason: (recordId, reason) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? { ...r, returnedReason: reason, updatedAt: new Date().toISOString().slice(0, 10) }
          : r
      ),
    })),

  getFilteredRecords: () => {
    const { records, filters } = get()
    return records.filter((r) => {
      if (filters.status !== 'all' && r.recordStatus !== filters.status) return false
      if (filters.period && r.settlement.period !== filters.period) return false
      if (filters.clientName && !r.clientName.includes(filters.clientName)) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const searchable = `${r.batchNo} ${r.employeeName} ${r.clientName} ${r.projectName} ${r.id}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })
  },

  getRoleTodos: () => {
    const { todos, currentRole } = get()
    return todos.filter((t) => t.role === currentRole).sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })
  },

  getStatsByRole: () => {
    const { records, currentRole } = get()
    const roleRecords = records.filter((r) => r.role === currentRole)
    return {
      total: roleRecords.length,
      pending: roleRecords.filter((r) => r.recordStatus === 'normal').length,
      overdue: roleRecords.filter((r) => r.recordStatus === 'overdue').length,
      disputed: roleRecords.filter((r) => r.recordStatus === 'disputed').length,
    }
  },
}))
