import { create } from 'zustand'
import { dashboardApi, type DashboardData } from '@/lib/api'

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  fetchDashboard: (role: string) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,

  fetchDashboard: async (role: string) => {
    set({ loading: true })
    try {
      const data = await dashboardApi.get(role)
      set({ data, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
