import { create } from 'zustand'
import type { Warning, WarningAction, WarningActionType, Role } from '@/types'
import { initialWarnings } from '@/utils/mockData'
import { consumePendingWarnings } from './useFollowUpStore'
import { useFollowUpStore } from './useFollowUpStore'

interface WarningState {
  warnings: Warning[]
  selectedWarningIds: string[]
  toggleSelectWarning: (id: string) => void
  selectAllWarnings: (ids: string[]) => void
  clearSelection: () => void
  executeAction: (warningId: string, actionType: WarningActionType, role: Role, remark?: string) => boolean
  batchAction: (actionType: WarningActionType, role: Role, remark?: string) => number
  ingestPendingWarnings: () => void
}

const ROLE_NAMES: Record<Role, string> = {
  doctor: '陈医生',
  nurse: '林护士',
  ph_specialist: '杨专员',
}

function syncFollowUpOnReturn(followUpId: string, ruleName: string, role: Role) {
  const store = useFollowUpStore.getState()
  const fu = store.followUps.find((f) => f.id === followUpId)
  if (!fu) return

  if (fu.status === 'warned') {
    store.transitionStatus(followUpId, 'in_progress', role, `预警「${ruleName}」退回，重新执行随访`)
    return
  }

  if (fu.status === 'pending_review') {
    store.transitionStatus(followUpId, 'in_progress', role, `预警「${ruleName}」退回，重新执行随访`)
    return
  }
}

function syncFollowUpOnConfirm(warningId: string, followUpId: string, role: Role) {
  const fuStore = useFollowUpStore.getState()
  const fu = fuStore.followUps.find((f) => f.id === followUpId)
  if (!fu || fu.status !== 'warned') return

  const warningStore = useWarningStore.getState()
  const allRelatedWarnings = warningStore.warnings.filter(
    (w) => w.followUpId === followUpId && w.id !== warningId
  )
  const hasActiveWarnings = allRelatedWarnings.some(
    (w) => w.status === 'active' || w.status === 'processing'
  )
  if (!hasActiveWarnings) {
    fuStore.transitionStatus(followUpId, 'confirmed', role, '预警全部处理完成，随访闭环')
  }
}

function syncFollowUpOnBatchReturn(warningIds: string[], role: Role) {
  const warningStore = useWarningStore.getState()
  const fuStore = useFollowUpStore.getState()

  const affectedFollowUpIds = new Set<string>()
  for (const wid of warningIds) {
    const w = warningStore.warnings.find((w) => w.id === wid)
    if (w) affectedFollowUpIds.add(w.followUpId)
  }

  for (const followUpId of affectedFollowUpIds) {
    const fu = fuStore.followUps.find((f) => f.id === followUpId)
    if (!fu || fu.status !== 'warned') continue

    const relatedWarnings = warningStore.warnings.filter((w) => w.followUpId === followUpId)
    const allReturned = relatedWarnings.every(
      (w) => w.status === 'returned' || w.status === 'resolved'
    )
    if (allReturned) {
      fuStore.transitionStatus(followUpId, 'in_progress', role, '全部预警退回，重新执行随访')
    }
  }
}

function syncFollowUpOnBatchConfirm(warningIds: string[], role: Role) {
  const warningStore = useWarningStore.getState()
  const fuStore = useFollowUpStore.getState()

  const affectedFollowUpIds = new Set<string>()
  for (const wid of warningIds) {
    const w = warningStore.warnings.find((w) => w.id === wid)
    if (w) affectedFollowUpIds.add(w.followUpId)
  }

  for (const followUpId of affectedFollowUpIds) {
    const fu = fuStore.followUps.find((f) => f.id === followUpId)
    if (!fu || fu.status !== 'warned') continue

    const relatedWarnings = warningStore.warnings.filter((w) => w.followUpId === followUpId)
    const hasActiveWarnings = relatedWarnings.some(
      (w) => w.status === 'active' || w.status === 'processing'
    )
    if (!hasActiveWarnings) {
      fuStore.transitionStatus(followUpId, 'confirmed', role, '预警全部处理完成，随访闭环')
    }
  }
}

export const useWarningStore = create<WarningState>((set, get) => ({
  warnings: initialWarnings,
  selectedWarningIds: [],
  toggleSelectWarning: (id) =>
    set((state) => ({
      selectedWarningIds: state.selectedWarningIds.includes(id)
        ? state.selectedWarningIds.filter((i) => i !== id)
        : [...state.selectedWarningIds, id],
    })),
  selectAllWarnings: (ids) => set({ selectedWarningIds: ids }),
  clearSelection: () => set({ selectedWarningIds: [] }),
  executeAction: (warningId, actionType, role, remark) => {
    let success = false
    let currentWarning: Warning | undefined

    set((state) => {
      const warning = state.warnings.find((w) => w.id === warningId)
      if (!warning) return state
      currentWarning = warning
      const newAction: WarningAction = {
        id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        warningId,
        actionType,
        operatorRole: role,
        operatorName: ROLE_NAMES[role],
        operatedAt: new Date().toISOString(),
        remark: remark || '',
      }
      let newStatus = warning.status
      switch (actionType) {
        case 'remind':
          break
        case 'confirm':
        case 'batch_confirm':
          newStatus = 'resolved'
          break
        case 'return':
        case 'batch_return':
          newStatus = 'returned'
          break
        case 'assign':
        case 'batch_assign':
          newStatus = 'processing'
          break
        default:
          break
      }
      success = true
      const warnings = state.warnings.map((w) => {
        if (w.id !== warningId) return w
        return { ...w, status: newStatus, actions: [...w.actions, newAction] }
      })
      return { warnings }
    })

    if (success && currentWarning) {
      if (actionType === 'return') {
        syncFollowUpOnReturn(currentWarning.followUpId, currentWarning.ruleName, role)
      }
      if (actionType === 'confirm') {
        syncFollowUpOnConfirm(warningId, currentWarning.followUpId, role)
      }
    }

    return success
  },
  batchAction: (actionType, role, remark) => {
    const { selectedWarningIds } = get()
    const ids = [...selectedWarningIds]
    let count = 0
    for (const id of ids) {
      if (get().executeAction(id, actionType, role, remark)) count++
    }

    if (count > 0) {
      if (actionType === 'batch_return' || actionType === 'return') {
        syncFollowUpOnBatchReturn(ids, role)
      }
      if (actionType === 'batch_confirm' || actionType === 'confirm') {
        syncFollowUpOnBatchConfirm(ids, role)
      }
    }

    set({ selectedWarningIds: [] })
    return count
  },
  ingestPendingWarnings: () => {
    const pending = consumePendingWarnings()
    if (!pending) return
    set((state) => {
      const existingIds = new Set(state.warnings.map((w) => w.followUpId + w.ruleName))
      const newWarnings = pending.warnings.filter(
        (w) => !existingIds.has(w.followUpId + w.ruleName)
      )
      if (newWarnings.length === 0) return state
      return { warnings: [...state.warnings, ...newWarnings] }
    })
  },
}))
