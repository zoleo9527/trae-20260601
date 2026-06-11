import api from './index'

export const getComplaints = (params?: Record<string, any>) => api.get('/complaints/', { params })
export const getComplaint = (id: number) => api.get(`/complaints/${id}`)
export const createComplaint = (data: any) => api.post('/complaints/', data)
export const updateComplaint = (id: number, data: any) => api.put(`/complaints/${id}`, data)
export const deleteComplaint = (id: number) => api.delete(`/complaints/${id}`)
export const handleComplaint = (id: number, data: any) => api.post(`/complaints/${id}/handle`, data)
export const getComplaintHistory = (id: number) => api.get(`/complaints/${id}/history`)
