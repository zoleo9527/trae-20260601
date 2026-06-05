import { create } from 'zustand'
import type { AuditLog } from '../shared/types'
import { useAuthStore } from './auth'

interface LogFilters {
  page?: number
  limit?: number
  orderId?: string
  [key: string]: unknown
}

interface LogsState {
  logs: AuditLog[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  fetchLogs: (filters?: LogFilters) => Promise<void>
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,

  fetchLogs: async (filters?: LogFilters) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        set({ isLoading: false })
        return
      }
      const currentFilters = { ...filters }
      
      const params = new URLSearchParams()
      if (currentFilters.page) params.append('page', currentFilters.page.toString())
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString())
      if (currentFilters.orderId) params.append('orderId', currentFilters.orderId)
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'page' && key !== 'limit' && key !== 'orderId') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      set({
        logs: data.data || [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
