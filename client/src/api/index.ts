import axios from 'axios'
import type { Patrol, Exception, Handover, DashboardData, StatusLog } from '../types'

const api = axios.create({ baseURL: '' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  getMe: () => api.get('/api/auth/me'),
}

export const patrolAPI = {
  list: (params?: Record<string, string>) =>
    api.get<Patrol[]>('/api/patrols', { params }),
  get: (id: string) => api.get<Patrol>(`/api/patrols/${id}`),
  create: (data: Partial<Patrol>) => api.post<Patrol>('/api/patrols', data),
  confirm: (id: string, data: Record<string, unknown>) =>
    api.put<Patrol>(`/api/patrols/${id}/confirm`, data),
  addAttachment: (id: string, data: { filename: string; uploader: string }) =>
    api.post<Patrol>(`/api/patrols/${id}/attachments`, data),
}

export const exceptionAPI = {
  list: (params?: Record<string, string>) =>
    api.get<Exception[]>('/api/exceptions', { params }),
  get: (id: string) => api.get<Exception>(`/api/exceptions/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post<Exception>('/api/exceptions', data),
  handle: (id: string, data: Record<string, unknown>) =>
    api.put<Exception>(`/api/exceptions/${id}/handle`, data),
  resolve: (id: string, data: Record<string, unknown>) =>
    api.put<Exception>(`/api/exceptions/${id}/resolve`, data),
  confirm: (id: string, data: Record<string, unknown>) =>
    api.put<Exception>(`/api/exceptions/${id}/confirm`, data),
  addAttachment: (id: string, data: { filename: string; uploader: string }) =>
    api.post<Exception>(`/api/exceptions/${id}/attachments`, data),
}

export const handoverAPI = {
  list: () => api.get<Handover[]>('/api/handovers'),
  get: (id: string) => api.get<Handover>(`/api/handovers/${id}`),
  create: (data: Partial<Handover>) =>
    api.post<Handover>('/api/handovers', data),
  accept: (id: string, data: Record<string, unknown>) =>
    api.put<Handover>(`/api/handovers/${id}/accept`, data),
}

export const dashboardAPI = {
  getData: () => api.get<DashboardData>('/api/dashboard'),
}

export const statusLogAPI = {
  list: (params: { recordType: string; recordId: string | number }) =>
    api.get<(StatusLog & { operatorName?: string })[]>('/api/status-logs', { params }),
}
