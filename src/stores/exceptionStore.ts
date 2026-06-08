import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExceptionRecord, ExceptionType } from '@/types'
import { mockExceptions } from '@/mock/data'
import { useLogStore } from '@/stores/logStore'

interface ExceptionState {
  exceptions: ExceptionRecord[]
  createException: (data: Omit<ExceptionRecord, 'id' | 'reportedAt' | 'status'>) => void
  resolveException: (id: string) => void
  getExceptionsByScheduleId: (scheduleId: string) => ExceptionRecord[]
  getExceptionsByType: (type: ExceptionType) => ExceptionRecord[]
  getExceptionById: (id: string) => ExceptionRecord | undefined
}

export const useExceptionStore = create<ExceptionState>()(
  persist(
    (set, get) => ({
      exceptions: mockExceptions,

      createException: (data) => {
        const newException: ExceptionRecord = {
          ...data,
          id: 'exc' + Date.now(),
          reportedAt: new Date().toISOString(),
          status: 'pending',
        }
        set((state) => ({ exceptions: [...state.exceptions, newException] }))
        useLogStore.getState().addLog({
          entityType: 'exception',
          entityId: newException.id,
          action: 'exception_mark',
          operator: data.reportedBy,
          operatorRole: 'fleet_manager',
          beforeValue: null,
          afterValue: { type: data.type, description: data.description },
        })
      },

      resolveException: (id) => {
        set((state) => ({
          exceptions: state.exceptions.map((exc) =>
            exc.id === id ? { ...exc, status: 'resolved' } : exc
          ),
        }))
      },

      getExceptionsByScheduleId: (scheduleId) => {
        return get().exceptions.filter((exc) => exc.scheduleId === scheduleId)
      },

      getExceptionsByType: (type) => {
        return get().exceptions.filter((exc) => exc.type === type)
      },

      getExceptionById: (id) => {
        return get().exceptions.find((exc) => exc.id === id)
      },
    }),
    { name: 'vehicle-exception-store' }
  )
)
