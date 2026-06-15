import axios from 'axios'
import type { Order, Dimension, User, TodayTasks, ApiResponse, UserRole } from './types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const orderApi = {
  getList: (role?: UserRole, status?: string) =>
    api.get<ApiResponse<Order[]>>('/orders', { params: { role, status } }),

  getDetail: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  getTodayTasks: (role?: UserRole) =>
    api.get<ApiResponse<TodayTasks>>('/orders/today/tasks', { params: { role } }),

  receiveManuscript: (
    id: string,
    data: {
      manuscriptContent: string
      dimension: Dimension
      operator: string
      note?: string
    }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/receive-manuscript`, data),

  reviewDimension: (
    id: string,
    data: {
      passed: boolean
      reviewedDimension: Dimension
      note?: string
      operator: string
    }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/review-dimension`, data),

  confirmColor: (
    id: string,
    data: { colorRequirement: string; operator: string }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/confirm-color`, data),

  completePrint: (id: string, data: { operator: string }) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/complete-print`, data),

  updateInstallTime: (
    id: string,
    data: {
      installTime: string
      installAddress: string
      operator: string
      note?: string
    }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/update-install-time`, data),

  completeInstall: (id: string, data: { operator: string; note?: string }) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/complete-install`, data),

  complete: (id: string, data: { operator: string }) =>
    api.post<ApiResponse<Order>>(`/orders/${id}/complete`, data),

  addNote: (
    id: string,
    data: { content: string; operator: string; role: UserRole }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/add-note`, data),

  addAttachment: (
    id: string,
    data: { name: string; type: 'manuscript' | 'photo' | 'other'; operator: string }
  ) => api.post<ApiResponse<Order>>(`/orders/${id}/attachments`, data),
}

export const userApi = {
  getList: () => api.get<ApiResponse<User[]>>('/users'),
}

export const systemApi = {
  reset: () => api.post<ApiResponse<Order[]>>('/reset'),
}
