import api from './api'
import type {
  ApiResponse,
  Customer,
  PaginatedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerQueryParams,
  Handover,
} from '@/types/types'

export const customerService = {
  getCustomers: async (params: CustomerQueryParams): Promise<ApiResponse<PaginatedResponse<Customer>>> => {
    return api.get('/customers', { params })
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    return api.get(`/customers/${id}`)
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return api.post('/customers', data)
  },

  updateCustomer: async (id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return api.put(`/customers/${id}`, data)
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/customers/${id}`)
  },

  getCustomerHandovers: async (id: string): Promise<ApiResponse<Handover[]>> => {
    return api.get(`/customers/${id}/handovers`)
  },
}

export default customerService