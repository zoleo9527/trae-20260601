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

function reconcileFollowUpStatus(followUpId: string, role: Role) {
  const warningStore = useWarningStore.getState()
  const fuStore = useFollowUpStore.getState()
  const fu = fuStore.followUps.find((f) => f.id === followUpId)
  if (!fu) return

  if (fu.status === 'completed' || fu.status === 'confirmed') return

  const relatedWarnings = warningStore.warnings.filter((w) => w.followUpId === followUpId)
  const hasActive = relatedWarnings.some((w) => w.status === 'active' || w.status === 'processing')
  const allSettled = relatedWarnings.every((w) => w.status === 'resolved' || w.status === 'returned')

  if (hasActive && fu.status !== 'warned') {
    fuStore.transitionStatus(followUpId, 'warned', role, '存在活跃预警，随访转入预警状态')
    return
  }

  if (!hasActive && fu.status === 'warned') {
    if (allSettled && relatedWarnings.every((w) => w.status === 'resolved')) {
      fuStore.transitionStatus(followUpId, 'confirmed', role, '预警全部处理完成，随访闭环')
    } else {
      fuStore.transitionStatus(followUpId, 'in_progress', role, '活跃预警已清除，重新执行随访')
    }
    return
  }
}

function reconcileAffectedFollowUps(warningIds: string[], role: Role) {
  const warningStore = useWarningStore.getState()
  const affectedFollowUpIds = new Set<string>()
  for (const wid of warningIds) {
    const w = warningStore.warnings.find((x) => x.id === wid)
    if (w) affectedFollowUpIds.add(w.followUpId)
  }
  for (const followUpId of affectedFollowUpIds) {
    reconcileFollowUpStatus(followUpId, role)
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
    let followUpId: string | undefined

    set((state) => {
      const warning = state.warnings.find((w) => w.id === warningId)
      if (!warning) return state
      followUpId = warning.followUpId
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

    if (success && followUpId && actionType !== 'remind') {
      reconcileFollowUpStatus(followUpId, role)
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

    if (count > 0 && actionType !== 'remind') {
      reconcileAffectedFollowUps(ids, role)
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
