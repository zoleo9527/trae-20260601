import api from './api'
import type {
  ApiResponse,
  Handover,
  PaginatedResponse,
  CreateHandoverRequest,
  UpdateHandoverRequest,
  HandoverQueryParams,
} from '@/types/types'

export const handoverService = {
  getHandovers: async (params: HandoverQueryParams): Promise<ApiResponse<PaginatedResponse<Handover>>> => {
    return api.get('/handovers', { params })
  },

  getHandover: async (id: string): Promise<ApiResponse<Handover>> => {
    return api.get(`/handovers/${id}`)
  },

  createHandover: async (data: CreateHandoverRequest): Promise<ApiResponse<Handover>> => {
    return api.post('/handovers', data)
  },

  updateHandover: async (id: string, data: UpdateHandoverRequest): Promise<ApiResponse<Handover>> => {
    return api.put(`/handovers/${id}`, data)
  },

  approveHandover: async (id: string, reviewComment?: string): Promise<ApiResponse<Handover>> => {
    return api.put(`/handovers/${id}/approve`, { comment: reviewComment })
  },

  rejectHandover: async (id: string, reviewComment?: string): Promise<ApiResponse<Handover>> => {
    return api.put(`/handovers/${id}/reject`, { comment: reviewComment })
  },
}

export default handoverService