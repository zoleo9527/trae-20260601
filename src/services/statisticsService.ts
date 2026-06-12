import api from './api'
import type { ApiResponse, DashboardStats, HandoverRateStats, RenewalRateStats } from '@/types/types'

export const statisticsService = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return api.get('/statistics/dashboard')
  },

  getHandoverRate: async (): Promise<ApiResponse<HandoverRateStats>> => {
    return api.get('/statistics/handover-rate')
  },

  getRenewalRate: async (): Promise<ApiResponse<RenewalRateStats>> => {
    return api.get('/statistics/renewal-rate')
  },
}

export default statisticsService