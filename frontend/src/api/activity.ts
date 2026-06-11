import api from './index'

export const getActivities = (params?: Record<string, any>) => api.get('/activities/', { params })
export const getActivity = (id: number) => api.get(`/activities/${id}`)
export const createActivity = (data: any) => api.post('/activities/', data)
export const updateActivity = (id: number, data: any) => api.put(`/activities/${id}`, data)
export const deleteActivity = (id: number) => api.delete(`/activities/${id}`)
export const reviewActivity = (id: number, data: any) => api.post(`/activities/${id}/review`, data)
export const getActivityHistory = (id: number) => api.get(`/activities/${id}/history`)
