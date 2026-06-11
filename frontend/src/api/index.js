import request from '@/utils/request'

export const login = (data) => request.post('/auth/login', data)
export const getProfile = () => request.get('/auth/profile')
export const getUsers = () => request.get('/auth/users')

export const getDashboard = () => request.get('/dashboard/summary')
export const getMyPending = () => request.get('/dashboard/my-pending')

export const getLeaseList = (params) => request.get('/leases', { params })
export const getMyLeaseList = (params) => request.get('/leases/my', { params })
export const getLeaseDetail = (id) => request.get(`/leases/${id}`)
export const createLease = (data) => request.post('/leases', data)
export const updateLease = (id, data) => request.put(`/leases/${id}`, data)
export const submitLease = (id) => request.put(`/leases/${id}/submit`)
export const confirmLease = (id) => request.put(`/leases/${id}/confirm`)
export const rejectLease = (id, data) => request.put(`/leases/${id}/reject`, data)
export const getBrands = () => request.get('/leases/options/brands')
export const getDeductionHistory = (leaseId) => request.get(`/leases/${leaseId}/deduction-history`)

export const getDeductionByLease = (leaseId) => request.get(`/deduction-rules/lease/${leaseId}`)
export const getDeductionVersion = (leaseId, version) => request.get(`/deduction-rules/${leaseId}/version/${version}`)
export const createDeduction = (data) => request.post('/deduction-rules', data)
export const updateDeduction = (id, data) => request.put(`/deduction-rules/${id}`, data)
export const confirmDeduction = (id) => request.put(`/deduction-rules/${id}/confirm`)
export const markLiability = (id, data) => request.put(`/deduction-rules/${id}/mark-liability`, data)
export const clearLiability = (id, data) => request.put(`/deduction-rules/${id}/clear-liability`, data)

export const createExport = (data) => request.post('/export', data)
export const getExportList = () => request.get('/export')
export const getExportDetail = (id) => request.get(`/export/${id}`)

export const getNotifications = (params) => request.get('/notifications', { params })
export const markNotifRead = (id) => request.put(`/notifications/read/${id}`)
export const markAllNotifRead = () => request.put('/notifications/read-all')
