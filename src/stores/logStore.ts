import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationLog, EntityType, ActionType, RoleName } from '@/types'
import { mockLogs } from '@/mock/data'

interface LogState {
  logs: OperationLog[]
  addLog: (params: {
    entityType: EntityType
    entityId: string
    action: ActionType
    operator: string
    operatorRole: RoleName
    beforeValue?: Record<string, unknown> | null
    afterValue?: Record<string, unknown> | null
  }) => void
  getLogsByEntity: (entityType: EntityType, entityId: string) => OperationLog[]
  getLogsByAction: (action: ActionType) => OperationLog[]
  getLogsByEntityId: (entityId: string) => OperationLog[]
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: mockLogs,

      addLog: (params) => {
        const newLog: OperationLog = {
          id: 'log' + Date.now(),
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          operator: params.operator,
          operatorRole: params.operatorRole,
          operatedAt: new Date().toISOString(),
          beforeValue: params.beforeValue ?? null,
          afterValue: params.afterValue ?? null,
        }
        set((state) => ({ logs: [...state.logs, newLog] }))
      },

      getLogsByEntity: (entityType, entityId) => {
        return get().logs.filter(
          (log) => log.entityType === entityType && log.entityId === entityId
        )
      },

      getLogsByAction: (action) => {
        return get().logs.filter((log) => log.action === action)
      },

      getLogsByEntityId: (entityId) => {
        return get().logs.filter((log) => log.entityId === entityId)
      },
    }),
    { name: 'vehicle-log-store' }
  )
)
