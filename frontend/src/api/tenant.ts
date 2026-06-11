import api from './index'

export const getTenants = (params?: Record<string, any>) => api.get('/tenants/', { params })
export const getTenant = (id: number) => api.get(`/tenants/${id}`)
export const createTenant = (data: any) => api.post('/tenants/', data)
export const updateTenant = (id: number, data: any) => api.put(`/tenants/${id}`, data)
export const deleteTenant = (id: number) => api.delete(`/tenants/${id}`)
export const reviewTenant = (id: number, data: any) => api.post(`/tenants/${id}/review`, data)
export const getTenantHistory = (id: number) => api.get(`/tenants/${id}/history`)
