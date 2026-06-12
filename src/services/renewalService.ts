import api from './api'
import type {
  ApiResponse,
  Customer,
  RenewalFollowUp,
  PaginatedResponse,
  CreateFollowUpRequest,
} from '@/types/types'

export const renewalService = {
  getRenewals: async (params: { page: number; pageSize: number }): Promise<ApiResponse<PaginatedResponse<Customer>>> => {
    return api.get('/renewals', { params })
  },

  getAlerts: async (): Promise<ApiResponse<Customer[]>> => {
    return api.get('/renewals/alerts')
  },

  getRiskCustomers: async (): Promise<ApiResponse<Customer[]>> => {
    return api.get('/renewals/risk-customers')
  },

  addFollowUp: async (customerId: string, data: CreateFollowUpRequest): Promise<ApiResponse<RenewalFollowUp>> => {
    return api.post(`/renewals/${customerId}/follow-ups`, data)
  },

  updateStatus: async (customerId: string, status: string): Promise<ApiResponse<Customer>> => {
    return api.put(`/renewals/${customerId}/status`, { status })
  },
}

export default renewalService