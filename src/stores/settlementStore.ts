import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import type { Settlement, Rejection, SettlementStatus, RoleName, RejectionCategory } from '@/types'
import { mockSettlements, mockRejections } from '@/mock/data'
import { useLogStore } from '@/stores/logStore'
import { useScheduleStore } from '@/stores/scheduleStore'

interface SettlementState {
  settlements: Settlement[]
  rejections: Rejection[]
  createSettlement: (data: Omit<Settlement, 'id' | 'createdAt' | 'status' | 'reviewedBy' | 'reviewedAt'>) => void
  approveSettlement: (id: string, reviewer: string, operatorRole: RoleName) => void
  rejectSettlement: (id: string, category: RejectionCategory, reason: string, rejectedBy: string, operatorRole: RoleName) => void
  resubmitSettlement: (id: string, data: Partial<Settlement>, resubmittedBy: string, operatorRole: RoleName) => void
  getSettlementById: (id: string) => Settlement | undefined
  getSettlementsByStatus: (status: SettlementStatus) => Settlement[]
  getRejectionsBySettlementId: (settlementId: string) => Rejection[]
  getSettlementByScheduleId: (scheduleId: string) => Settlement | undefined
  getRejectionCategoryStats: (days?: number) => { category: RejectionCategory; count: number; totalAmount: number }[]
  getOverdueRejections: () => { rejection: Rejection; settlement: Settlement | undefined; pendingDays: number; overdue: boolean }[]
  getOverdueRejectionCount: () => number
  getRejectionSLAStats: (days?: number, createdBy?: string) => {
    avgProcessingHours: number
    complianceRate: number
    overdueCount: number
    totalResolved: number
    categoryBreakdown: { category: RejectionCategory; avgHours: number; count: number }[]
  }
}

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set, get) => ({
      settlements: mockSettlements,
      rejections: mockRejections,

      createSettlement: (data) => {
        const newSettlement: Settlement = {
          ...data,
          id: 'set' + Date.now(),
          status: 'PENDING_REVIEW',
          reviewedBy: '',
          reviewedAt: '',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ settlements: [...state.settlements, newSettlement] }))
        useLogStore.getState().addLog({
          entityType: 'settlement',
          entityId: newSettlement.id,
          action: 'create',
          operator: data.createdBy,
          operatorRole: 'dispatcher',
          beforeValue: null,
          afterValue: { scheduleId: data.scheduleId, totalFee: data.totalFee },
        })
      },

      approveSettlement: (id, reviewer, operatorRole) => {
        const settlement = get().settlements.find((s) => s.id === id)
        set((state) => ({
          settlements: state.settlements.map((s) =>
            s.id === id
              ? { ...s, status: 'APPROVED', reviewedBy: reviewer, reviewedAt: new Date().toISOString() }
              : s
          ),
        }))
        if (settlement) {
          useScheduleStore.getState().markSettled(settlement.scheduleId)
          useLogStore.getState().addLog({
            entityType: 'settlement',
            entityId: id,
            action: 'approve',
            operator: reviewer,
            operatorRole,
            beforeValue: { status: 'PENDING_REVIEW' },
            afterValue: { status: 'APPROVED' },
          })
        }
      },

      rejectSettlement: (id, category, reason, rejectedBy, operatorRole) => {
        const newRejection: Rejection = {
          id: 'rej' + Date.now(),
          settlementId: id,
          category,
          reason,
          rejectedBy,
          rejectedAt: new Date().toISOString(),
          resubmittedBy: '',
          resubmittedAt: '',
          status: 'PENDING',
        }
        set((state) => ({
          settlements: state.settlements.map((s) =>
            s.id === id
              ? { ...s, status: 'REJECTED', reviewedBy: rejectedBy, reviewedAt: newRejection.rejectedAt }
              : s
          ),
          rejections: [...state.rejections, newRejection],
        }))
        useLogStore.getState().addLog({
          entityType: 'settlement',
          entityId: id,
          action: 'reject',
          operator: rejectedBy,
          operatorRole,
          beforeValue: { status: 'PENDING_REVIEW' },
          afterValue: { status: 'REJECTED', category, reason },
        })
      },

      resubmitSettlement: (id, data, resubmittedBy, operatorRole) => {
        const now = new Date().toISOString()
        const pendingRejection = get().rejections.find((r) => r.settlementId === id && r.status === 'PENDING')
        const processingHours = pendingRejection
          ? Math.round(dayjs(now).diff(dayjs(pendingRejection.rejectedAt), 'minute') / 60 * 10) / 10
          : 0
        set((state) => ({
          settlements: state.settlements.map((s) =>
            s.id === id
              ? { ...s, ...data, status: 'PENDING_REVIEW', reviewedBy: '', reviewedAt: '' }
              : s
          ),
          rejections: state.rejections.map((r) =>
            r.settlementId === id && r.status === 'PENDING'
              ? { ...r, status: 'RESOLVED', resubmittedBy, resubmittedAt: now }
              : r
          ),
        }))
        useLogStore.getState().addLog({
          entityType: 'settlement',
          entityId: id,
          action: 'resubmit',
          operator: resubmittedBy,
          operatorRole,
          beforeValue: { status: 'REJECTED' },
          afterValue: { status: 'PENDING_REVIEW', processingHours },
        })
      },

      getSettlementById: (id) => {
        return get().settlements.find((s) => s.id === id)
      },

      getSettlementsByStatus: (status) => {
        return get().settlements.filter((s) => s.status === status)
      },

      getRejectionsBySettlementId: (settlementId) => {
        return get().rejections.filter((r) => r.settlementId === settlementId)
      },

      getSettlementByScheduleId: (scheduleId) => {
        return get().settlements.find((s) => s.scheduleId === scheduleId)
      },

      getRejectionCategoryStats: (days = 30) => {
        const rejections = get().rejections
        const settlements = get().settlements
        const cutoff = dayjs().subtract(days, 'day').toISOString()
        const recentRejections = rejections.filter((r) => r.rejectedAt >= cutoff)
        const categories: RejectionCategory[] = ['amount_anomaly', 'voucher_missing', 'timeout_dispute', 'other']
        return categories.map((category) => {
          const catRejections = recentRejections.filter((r) => r.category === category)
          const totalAmount = catRejections.reduce((sum, r) => {
            const settlement = settlements.find((s) => s.id === r.settlementId)
            return sum + (settlement?.totalFee ?? 0)
          }, 0)
          return { category, count: catRejections.length, totalAmount }
        }).filter((c) => c.count > 0)
      },

      getOverdueRejections: () => {
        const rejections = get().rejections
        const settlements = get().settlements
        return rejections
          .filter((r) => r.status === 'PENDING')
          .map((r) => {
            const pendingDays = dayjs().diff(dayjs(r.rejectedAt), 'day')
            const settlement = settlements.find((s) => s.id === r.settlementId)
            return { rejection: r, settlement, pendingDays, overdue: pendingDays > 3 }
          })
      },

      getOverdueRejectionCount: () => {
        return get().rejections
          .filter((r) => r.status === 'PENDING')
          .filter((r) => dayjs().diff(dayjs(r.rejectedAt), 'day') > 3)
          .length
      },

      getRejectionSLAStats: (days = 30, createdBy?: string) => {
        const rejections = get().rejections
        const settlements = get().settlements
        const cutoff = dayjs().subtract(days, 'day').toISOString()
        const ownedSettlementIds = createdBy
          ? settlements.filter((s) => s.createdBy.includes(createdBy)).map((s) => s.id)
          : null
        const filterOwned = (r: Rejection) => !ownedSettlementIds || ownedSettlementIds.includes(r.settlementId)
        const recentResolved = rejections.filter(
          (r) => r.status === 'RESOLVED' && r.rejectedAt >= cutoff && r.resubmittedAt && filterOwned(r)
        )
        const currentOverdue = rejections.filter(
          (r) => r.status === 'PENDING' && dayjs().diff(dayjs(r.rejectedAt), 'day') > 3 && filterOwned(r)
        )
        const processingHoursList = recentResolved.map((r) =>
          dayjs(r.resubmittedAt).diff(dayjs(r.rejectedAt), 'minute') / 60
        )
        const avgProcessingHours = processingHoursList.length > 0
          ? Math.round(processingHoursList.reduce((a, b) => a + b, 0) / processingHoursList.length * 10) / 10
          : 0
        const withinSLA = processingHoursList.filter((h) => h <= 72).length
        const complianceRate = processingHoursList.length > 0
          ? Math.round(withinSLA / processingHoursList.length * 1000) / 10
          : 100
        const categories: RejectionCategory[] = ['amount_anomaly', 'voucher_missing', 'timeout_dispute', 'other']
        const categoryBreakdown = categories.map((category) => {
          const catResolved = recentResolved.filter((r) => r.category === category)
          const catHours = catResolved.map((r) =>
            dayjs(r.resubmittedAt).diff(dayjs(r.rejectedAt), 'minute') / 60
          )
          return {
            category,
            avgHours: catHours.length > 0
              ? Math.round(catHours.reduce((a, b) => a + b, 0) / catHours.length * 10) / 10
              : 0,
            count: catResolved.length,
          }
        }).filter((c) => c.count > 0)
        return {
          avgProcessingHours,
          complianceRate,
          overdueCount: currentOverdue.length,
          totalResolved: recentResolved.length,
          categoryBreakdown,
        }
      },
    }),
    { name: 'vehicle-settlement-store' }
  )
)
