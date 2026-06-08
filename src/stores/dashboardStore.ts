import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RiskItem, OperationLog } from '@/types'
import { mockRiskItems } from '@/mock/data'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSettlementStore } from '@/stores/settlementStore'
import { useExceptionStore } from '@/stores/exceptionStore'
import { useLogStore } from '@/stores/logStore'

interface DashboardState {
  riskItems: RiskItem[]
  getTodoCounts: () => {
    pendingSchedules: number
    departedSchedules: number
    pendingSettlements: number
    pendingExceptions: number
    rejectedSettlements: number
  }
  getRiskItems: () => RiskItem[]
  getUnreadRiskItems: () => RiskItem[]
  markRiskRead: (id: string) => void
  getRecentChanges: (limit?: number) => OperationLog[]
  getRejectedSettlements: () => { settlement: import('@/types').Settlement; rejection: import('@/types').Rejection; schedule: import('@/types').Schedule | undefined }[]
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      riskItems: mockRiskItems,

      getTodoCounts: () => {
        const schedules = useScheduleStore.getState().schedules
        const settlements = useSettlementStore.getState().settlements
        const exceptions = useExceptionStore.getState().exceptions
        return {
          pendingSchedules: schedules.filter((s) => s.status === 'PENDING').length,
          departedSchedules: schedules.filter((s) => s.status === 'DEPARTED').length,
          pendingSettlements: settlements.filter((s) => s.status === 'PENDING_REVIEW').length,
          pendingExceptions: exceptions.filter((e) => e.status === 'pending').length,
          rejectedSettlements: settlements.filter((s) => s.status === 'REJECTED').length,
        }
      },

      getRiskItems: () => {
        return get().riskItems
      },

      getUnreadRiskItems: () => {
        return get().riskItems.filter((item) => !item.read)
      },

      markRiskRead: (id: string) => {
        set((state) => ({
          riskItems: state.riskItems.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        }))
      },

      getRecentChanges: (limit = 20) => {
        const logs = useLogStore.getState().logs
        return [...logs]
          .sort((a, b) => b.operatedAt.localeCompare(a.operatedAt))
          .slice(0, limit)
      },

      getRejectedSettlements: () => {
        const settlements = useSettlementStore.getState().settlements
        const rejections = useSettlementStore.getState().rejections
        const schedules = useScheduleStore.getState().schedules
        return settlements
          .filter((s) => s.status === 'REJECTED')
          .map((settlement) => {
            const rejection = rejections.find(
              (r) => r.settlementId === settlement.id && r.status === 'PENDING'
            )
            const schedule = schedules.find((s) => s.id === settlement.scheduleId)
            return rejection ? { settlement, rejection, schedule } : null
          })
          .filter(Boolean) as { settlement: import('@/types').Settlement; rejection: import('@/types').Rejection; schedule: import('@/types').Schedule | undefined }[]
      },
    }),
    { name: 'vehicle-dashboard-store' }
  )
)
