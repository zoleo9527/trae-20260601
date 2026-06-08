import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settlement, Rejection, SettlementStatus, RoleName } from '@/types'
import { mockSettlements, mockRejections } from '@/mock/data'
import { useLogStore } from '@/stores/logStore'
import { useScheduleStore } from '@/stores/scheduleStore'

interface SettlementState {
  settlements: Settlement[]
  rejections: Rejection[]
  createSettlement: (data: Omit<Settlement, 'id' | 'createdAt' | 'status' | 'reviewedBy' | 'reviewedAt'>) => void
  approveSettlement: (id: string, reviewer: string, operatorRole: RoleName) => void
  rejectSettlement: (id: string, reason: string, rejectedBy: string, operatorRole: RoleName) => void
  resubmitSettlement: (id: string, data: Partial<Settlement>, resubmittedBy: string, operatorRole: RoleName) => void
  getSettlementById: (id: string) => Settlement | undefined
  getSettlementsByStatus: (status: SettlementStatus) => Settlement[]
  getRejectionsBySettlementId: (settlementId: string) => Rejection[]
  getSettlementByScheduleId: (scheduleId: string) => Settlement | undefined
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

      rejectSettlement: (id, reason, rejectedBy, operatorRole) => {
        const newRejection: Rejection = {
          id: 'rej' + Date.now(),
          settlementId: id,
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
          afterValue: { status: 'REJECTED', reason },
        })
      },

      resubmitSettlement: (id, data, resubmittedBy, operatorRole) => {
        set((state) => ({
          settlements: state.settlements.map((s) =>
            s.id === id
              ? { ...s, ...data, status: 'PENDING_REVIEW', reviewedBy: '', reviewedAt: '' }
              : s
          ),
          rejections: state.rejections.map((r) =>
            r.settlementId === id && r.status === 'PENDING'
              ? { ...r, status: 'RESOLVED', resubmittedBy, resubmittedAt: new Date().toISOString() }
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
          afterValue: { status: 'PENDING_REVIEW' },
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
    }),
    { name: 'vehicle-settlement-store' }
  )
)
