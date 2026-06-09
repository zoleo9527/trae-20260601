import { create } from 'zustand'
import { logApi, type OperationLog } from '@/lib/api'

interface LogsState {
  logs: OperationLog[]
  total: number
  loading: boolean
  fetchLogs: (params?: { containerNo?: string; role?: string; action?: string; startTime?: string; endTime?: string; page?: number; size?: number }) => Promise<void>
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  total: 0,
  loading: false,

  fetchLogs: async (params) => {
    set({ loading: true })
    try {
      const res = await logApi.list(params)
      set({ logs: res.list, total: res.total, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
