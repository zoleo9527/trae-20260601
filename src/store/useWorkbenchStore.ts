import { create } from 'zustand'
import type { OperationRecord, TodoItem, FilterState, Role, RecordStatus, TimelineAction, TimelineEntry, ResponsibilityInfo } from '@/types'
import { mockRecords, mockTodos } from '@/data/mockData'
import { ROLE_LABELS } from '@/types'

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

function guessRoleFromNote(note: string): Role | null {
  if (!note) return null
  const n = note.toLowerCase()
  if (n.includes('考勤') || n.includes('签到') || n.includes('驻场') || n.includes('现场')) return 'onsite'
  if (n.includes('招聘') || n.includes('人员') || n.includes('入职') || n.includes('离职') || n.includes('替补') || n.includes('排班')) return 'recruiter'
  if (n.includes('工资') || n.includes('薪酬') || n.includes('会计') || n.includes('计费') || n.includes('开票')) return 'payroll'
  return null
}

function getLatestTimelineEntry(record: OperationRecord): TimelineEntry | null {
  if (!record.timeline || record.timeline.length === 0) return null
  return [...record.timeline].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
}

function computeResponsibility(record: OperationRecord): ResponsibilityInfo {
  const { settlement, reconciliation, recordStatus } = record
  const latest = getLatestTimelineEntry(record)

  if (recordStatus === 'disputed') {
    const involved: Role[] = []
    let pendingRole: Role = 'recruiter'
    let pendingAction = '待三方协商确认'

    if (settlement.status === 'disputed') {
      const g = guessRoleFromNote(settlement.supplementNote || record.disputeDetail || '')
      if (g && !involved.includes(g)) involved.push(g)
    }
    if (reconciliation.status === 'disputed') {
      const g = guessRoleFromNote(reconciliation.discrepancyNote || record.disputeDetail || '')
      if (g && !involved.includes(g)) involved.push(g)
    }
    if (latest) {
      const otherRoles: Role[] = ['recruiter', 'onsite', 'payroll'].filter((r) => r !== latest.role) as Role[]
      otherRoles.forEach((r) => { if (!involved.includes(r)) involved.push(r) })
      pendingRole = otherRoles[0] || 'recruiter'
    }
    if (involved.length === 0) involved.push('recruiter', 'onsite', 'payroll')

    return {
      pendingRole,
      responsibilityText: `责任争议：涉及${involved.map((r) => ROLE_LABELS[r]).join('、')}，需共同确认${record.disputeDetail ? '：' + record.disputeDetail.slice(0, 30) + (record.disputeDetail.length > 30 ? '...' : '') : ''}`,
      isUnclear: true,
      involvedRoles: involved,
      pendingAction,
    }
  }

  if (recordStatus === 'returned') {
    if (settlement.status === 'returned') {
      const g = guessRoleFromNote(settlement.returnedReason || record.returnedReason || '')
      const pendingRole = g || 'onsite'
      const involved: Role[] = ['payroll', pendingRole]
      return {
        pendingRole,
        responsibilityText: `结算已退回，${ROLE_LABELS[pendingRole]}需补充：${(settlement.returnedReason || record.returnedReason || '').slice(0, 25)}${((settlement.returnedReason || record.returnedReason || '').length > 25 ? '...' : '')}`,
        isUnclear: !g,
        involvedRoles: involved,
        pendingAction: `补充${g === 'onsite' ? '考勤' : g === 'recruiter' ? '人员' : '结算'}材料`,
      }
    }
    if (reconciliation.status === 'discrepancy') {
      const g = guessRoleFromNote(reconciliation.discrepancyNote || record.returnedReason || '')
      const pendingRole = g || 'recruiter'
      const involved: Role[] = ['payroll', pendingRole]
      return {
        pendingRole,
        responsibilityText: `对账有差异，${ROLE_LABELS[pendingRole]}需确认：${(reconciliation.discrepancyNote || record.returnedReason || '').slice(0, 25)}${((reconciliation.discrepancyNote || record.returnedReason || '').length > 25 ? '...' : '')}`,
        isUnclear: !g,
        involvedRoles: involved,
        pendingAction: `确认${g === 'onsite' ? '考勤' : g === 'recruiter' ? '人员' : '计费'}差异`,
      }
    }
  }

  if (recordStatus === 'overdue') {
    if (settlement.status === 'pending') {
      return {
        pendingRole: 'payroll',
        responsibilityText: '工资结算逾期未处理，需薪酬会计尽快启动结算流程',
        isUnclear: false,
        involvedRoles: ['payroll'],
        pendingAction: '启动工资结算',
      }
    }
    if (reconciliation.status === 'pending') {
      return {
        pendingRole: 'payroll',
        responsibilityText: '客户对账逾期未发送，需薪酬会计尽快发送对账单',
        isUnclear: false,
        involvedRoles: ['payroll'],
        pendingAction: '发送客户对账单',
      }
    }
    if (settlement.status === 'processing') {
      return {
        pendingRole: 'payroll',
        responsibilityText: '工资结算处理中但已逾期，需薪酬会计加快处理',
        isUnclear: false,
        involvedRoles: ['payroll'],
        pendingAction: '完成工资结算',
      }
    }
  }

  if (settlement.status === 'pending') {
    return {
      pendingRole: 'payroll',
      responsibilityText: '待薪酬会计进行工资结算',
      isUnclear: false,
      involvedRoles: ['payroll'],
      pendingAction: '开始工资结算',
    }
  }
  if (settlement.status === 'processing') {
    return {
      pendingRole: 'payroll',
      responsibilityText: '薪酬会计正在处理工资结算',
      isUnclear: false,
      involvedRoles: ['payroll'],
      pendingAction: '完成工资结算',
    }
  }
  if (settlement.status === 'confirmed' && reconciliation.status === 'pending') {
    return {
      pendingRole: 'payroll',
      responsibilityText: '工资结算已确认，待薪酬会计发送客户对账单',
      isUnclear: false,
      involvedRoles: ['payroll'],
      pendingAction: '发送客户对账单',
    }
  }
  if (reconciliation.status === 'sent') {
    return {
      pendingRole: 'recruiter',
      responsibilityText: '对账单已发送客户，待招聘专员跟进客户确认回签',
      isUnclear: false,
      involvedRoles: ['recruiter'],
      pendingAction: '跟进客户确认',
    }
  }
  if (reconciliation.status === 'confirmed') {
    return {
      pendingRole: 'none',
      responsibilityText: '工资结算与客户对账均已完成，流程结束',
      isUnclear: false,
      involvedRoles: [],
      pendingAction: '无',
    }
  }

  return {
    pendingRole: record.role,
    responsibilityText: `当前由${ROLE_LABELS[record.role]}负责跟进`,
    isUnclear: true,
    involvedRoles: [record.role],
    pendingAction: '跟进处理',
  }
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
  getResponsibility: (record: OperationRecord) => ResponsibilityInfo

  getFilteredRecords: () => OperationRecord[]
  getRoleTodos: () => TodoItem[]
  getStatsByRole: () => { total: number; pending: number; overdue: number; disputed: number }
}

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  role: 'all',
  pendingRole: 'all',
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

  getResponsibility: (record) => computeResponsibility(record),

  getFilteredRecords: () => {
    const { records, filters } = get()
    return records.filter((r) => {
      if (filters.status !== 'all' && r.recordStatus !== filters.status) return false
      if (filters.period && r.settlement.period !== filters.period) return false
      if (filters.clientName && !r.clientName.includes(filters.clientName)) return false
      if (filters.pendingRole !== 'all') {
        const resp = computeResponsibility(r)
        if (filters.pendingRole === 'unclear') {
          if (!resp.isUnclear) return false
        } else if (resp.pendingRole !== filters.pendingRole) return false
      }
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
