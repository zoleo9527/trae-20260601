import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export const couponApi = {
  list: async (params?: Record<string, any>) => {
    const response = await api.get('/coupons', { params })
    return response.data
  },
  create: async (data: Record<string, any>) => {
    const response = await api.post('/coupons', data)
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get(`/coupons/${id}`)
    return response.data
  },
  update: async (id: number, data: Record<string, any>) => {
    const response = await api.put(`/coupons/${id}`, data)
    return response.data
  },
  submit: async (id: number) => {
    const response = await api.post(`/coupons/${id}/submit`)
    return response.data
  },
  review: async (id: number, data: { action: 'approve' | 'reject'; remarks?: string }) => {
    const response = await api.post(`/coupons/${id}/review`, data)
    return response.data
  },
  verify: async (id: number) => {
    const response = await api.post(`/coupons/${id}/verify`)
    return response.data
  },
  history: async (id: number) => {
    const response = await api.get(`/coupons/${id}/history`)
    return response.data
  },
}

export const memberApi = {
  list: async (params?: Record<string, any>) => {
    const response = await api.get('/members', { params })
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get(`/members/${id}`)
    return response.data
  },
  getCoupons: async (id: number) => {
    const response = await api.get(`/members/${id}/coupons`)
    return response.data
  },
}

export const batchApi = {
  list: async (params?: Record<string, any>) => {
    const response = await api.get('/batches', { params })
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get(`/batches/${id}`)
    return response.data
  },
  getCoupons: async (id: number) => {
    const response = await api.get(`/batches/${id}/coupons`)
    return response.data
  },
}

export const policyApi = {
  list: async (params?: Record<string, any>) => {
    const response = await api.get('/policies', { params })
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get(`/policies/${id}`)
    return response.data
  },
}

export const attachmentApi = {
  upload: async (couponId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('coupon_id', couponId.toString())
    const response = await api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  get: async (id: number) => {
    const response = await api.get(`/attachments/${id}`)
    return response.data
  },
  preview: async (id: number) => {
    const response = await api.get(`/attachments/${id}/preview`, { responseType: 'blob' })
    return response.data
  },
}

export const dashboardApi = {
  todos: async () => {
    const response = await api.get('/dashboard/todos')
    return response.data
  },
  risks: async () => {
    const response = await api.get('/dashboard/risks')
    return response.data
  },
  recent: async () => {
    const response = await api.get('/dashboard/recent')
    return response.data
  },
}

export default api
