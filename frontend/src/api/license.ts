import api from './index'

export const getLicenses = (params?: Record<string, any>) => api.get('/licenses/', { params })
export const getLicense = (id: number) => api.get(`/licenses/${id}`)
export const createLicense = (data: any) => api.post('/licenses/', data)
export const updateLicense = (id: number, data: any) => api.put(`/licenses/${id}`, data)
export const deleteLicense = (id: number) => api.delete(`/licenses/${id}`)
export const reviewLicense = (id: number, data: any) => api.post(`/licenses/${id}/review`, data)
export const getLicenseHistory = (id: number) => api.get(`/licenses/${id}/history`)
