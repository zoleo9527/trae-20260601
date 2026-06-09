import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationLog, UserRole, OperationType } from '@/types'

interface OperationLogState {
  logs: OperationLog[]
  setLogs: (logs: OperationLog[]) => void
  addLog: (data: Omit<OperationLog, 'id'>) => void
  getByRelatedId: (id: string) => OperationLog[]
  getFiltered: (filters: { role?: UserRole; type?: OperationType; keyword?: string; startDate?: string; endDate?: string }) => OperationLog[]
}

export const useOperationLogStore = create<OperationLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      setLogs: (logs) => set({ logs }),
      addLog: (data) =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              ...data,
              id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
            },
          ],
        })),
      getByRelatedId: (id) => get().logs.filter((log) => log.relatedId === id),
      getFiltered: (filters) => {
        const { role, type, keyword, startDate, endDate } = filters
        return get().logs.filter((log) => {
          if (role && log.operatorRole !== role) return false
          if (type && log.type !== type) return false
          if (keyword && !log.detail.includes(keyword) && !log.operatorName.includes(keyword)) return false
          if (startDate && log.operatedAt < startDate) return false
          if (endDate && log.operatedAt > endDate) return false
          return true
        })
      },
    }),
    { name: 'dental_logs' }
  )
)
