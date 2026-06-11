import api from './index'

export const getHistoryRecords = (params?: Record<string, any>) => api.get('/history/', { params })
