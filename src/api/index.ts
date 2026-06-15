import axios from 'axios'
import type { Order, SparePart, CreateOrderRequest, CreateInspectionRequest, CreateWarrantyRequest, CreateNoteRequest } from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const orderApi = {
  getAll: (status?: string, search?: string): Promise<Order[]> => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.append('status', status)
    if (search) params.append('search', search)
    return api.get(`/orders?${params.toString()}`).then(res => res.data)
  },

  getById: (id: string): Promise<Order> => {
    return api.get(`/orders/${id}`).then(res => res.data)
  },

  create: (data: CreateOrderRequest): Promise<Order> => {
    return api.post('/orders', data).then(res => res.data)
  },

  updateStatus: (id: string, status: string): Promise<Order> => {
    return api.put(`/orders/${id}`, { status }).then(res => res.data)
  },

  delete: (id: string): Promise<void> => {
    return api.delete(`/orders/${id}`).then(res => res.data)
  }
}

export const inspectionApi = {
  getByOrderId: (orderId: string): Promise<Order['inspection']> => {
    return api.get(`/orders/${orderId}/inspection`).then(res => res.data)
  },

  create: (orderId: string, data: CreateInspectionRequest & { photos?: { base64: string; description: string }[] }): Promise<Order['inspection']> => {
    return api.post(`/orders/${orderId}/inspection`, data).then(res => res.data)
  }
}

export const warrantyApi = {
  getByOrderId: (orderId: string): Promise<Order['warranty']> => {
    return api.get(`/orders/${orderId}/warranty`).then(res => res.data)
  },

  create: (orderId: string, data: CreateWarrantyRequest): Promise<Order['warranty']> => {
    return api.post(`/orders/${orderId}/warranty`, data).then(res => res.data)
  }
}

export const noteApi = {
  create: (orderId: string, data: CreateNoteRequest): Promise<Order['notes']> => {
    return api.post(`/orders/${orderId}/notes`, data).then(res => res.data)
  }
}

export const sparePartApi = {
  getAll: (): Promise<SparePart[]> => {
    return api.get('/spare-parts').then(res => res.data)
  },

  create: (data: Omit<SparePart, 'id' | 'created_at' | 'updated_at'>): Promise<SparePart> => {
    return api.post('/spare-parts', data).then(res => res.data)
  },

  update: (id: string, data: Partial<Omit<SparePart, 'id' | 'created_at' | 'updated_at'>>): Promise<SparePart> => {
    return api.put(`/spare-parts/${id}`, data).then(res => res.data)
  },

  delete: (id: string): Promise<void> => {
    return api.delete(`/spare-parts/${id}`).then(res => res.data)
  },

  use: (orderId: string, data: { spare_part_id: string; quantity: number; used_by: string; used_by_name: string }): Promise<void> => {
    return api.post(`/orders/${orderId}/spare-parts`, data).then(res => res.data)
  }
}

export const resetApi = {
  resetData: (): Promise<{ message: string }> => {
    return api.post('/reset').then(res => res.data)
  }
}