import { create } from 'zustand'
import type { FollowUp, Indicator, Role } from '@/types'
import { initialFollowUps, initialPatients } from '@/utils/mockData'
import { transitionFollowUp } from '@/utils/statusEngine'
import { detectWarnings } from '@/utils/warningEngine'

interface FollowUpState {
  patients: typeof initialPatients
  followUps: FollowUp[]
  selectedFollowUpId: string | null
  selectFollowUp: (id: string | null) => void
  addIndicator: (followUpId: string, indicator: Omit<Indicator, 'id' | 'followUpId' | 'recordedAt' | 'recorderRole'>, role: Role) => { hasWarning: boolean; warningCount: number }
  transitionStatus: (followUpId: string, targetStatus: FollowUp['status'], role: Role, remark?: string) => boolean
  getPatientById: (id: string) => typeof initialPatients[0] | undefined
  getFollowUpsByStatus: (status?: FollowUp['status']) => FollowUp[]
}

let pendingWarnings: { followUpId: string; warnings: ReturnType<typeof detectWarnings> } | null = null

export function consumePendingWarnings() {
  const w = pendingWarnings
  pendingWarnings = null
  return w
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  patients: initialPatients,
  followUps: initialFollowUps,
  selectedFollowUpId: null,
  selectFollowUp: (id) => set({ selectedFollowUpId: id }),
  addIndicator: (followUpId, indicatorData, role) => {
    let hasWarning = false
    let warningCount = 0
    set((state) => {
      const newIndicator: Indicator = {
        ...indicatorData,
        id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        followUpId,
        recordedAt: new Date().toISOString(),
        recorderRole: role,
      }
      const followUps = state.followUps.map((fu) => {
        if (fu.id !== followUpId) return fu
        const updatedIndicators = [...fu.indicators, newIndicator]
        const newWarnings = detectWarnings(followUpId, updatedIndicators, [])
        if (newWarnings.length > 0) {
          hasWarning = true
          warningCount = newWarnings.length
          pendingWarnings = { followUpId, warnings: newWarnings }
        }
        return { ...fu, indicators: updatedIndicators, updatedAt: new Date().toISOString() }
      })
      return { followUps }
    })
    return { hasWarning, warningCount }
  },
  transitionStatus: (followUpId, targetStatus, role, remark) => {
    let success = false
    set((state) => {
      const followUp = state.followUps.find((fu) => fu.id === followUpId)
      if (!followUp) return state
      const result = transitionFollowUp(followUp, targetStatus, role, remark || '')
      if (!result) return state
      success = true
      const followUps = state.followUps.map((fu) => {
        if (fu.id !== followUpId) return fu
        return {
          ...fu,
          status: result.newStatus,
          assigneeRole: result.newAssigneeRole,
          assigneeName: result.newAssigneeName,
          updatedAt: new Date().toISOString(),
          statusLogs: [...fu.statusLogs, result.statusLog],
        }
      })
      return { followUps }
    })
    return success
  },
  getPatientById: (id) => get().patients.find((p) => p.id === id),
  getFollowUpsByStatus: (status) => {
    const fus = get().followUps
    if (!status) return fus
    return fus.filter((fu) => fu.status === status)
  },
}))
