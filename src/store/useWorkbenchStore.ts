import { create } from 'zustand'
import type { OperationRecord, TodoItem, FilterState, Role } from '@/types'
import { mockRecords, mockTodos } from '@/data/mockData'

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
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              settlement: {
                ...r.settlement,
                status,
                ...(note ? { supplementNote: note } : {}),
              },
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : r
      ),
    })),

  updateReconciliationStatus: (recordId, status, note) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              reconciliation: {
                ...r.reconciliation,
                status,
                ...(note ? { discrepancyNote: note } : {}),
              },
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : r
      ),
    })),

  addSupplementNote: (recordId, note) =>
    set((s) => ({
      records: s.records.map((r) =>
        r.id === recordId
          ? { ...r, supplementNote: note, updatedAt: new Date().toISOString().slice(0, 10) }
          : r
      ),
    })),

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
