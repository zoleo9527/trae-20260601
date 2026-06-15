import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    throw error
  }
)

export const login = (username, password) => api.post('/login', { username, password })
export const getUsers = () => api.get('/users')
export const getOrders = (params) => api.get('/orders', { params })
export const getOrder = (orderId) => api.get(`/orders/${orderId}`)
export const acceptOrder = (orderId, technicianId) => api.post(`/orders/${orderId}/accept`, { technicianId })
export const startOrder = (orderId) => api.post(`/orders/${orderId}/start`)
export const completeOrder = (orderId, photos) => api.post(`/orders/${orderId}/complete`, { photos })
export const reportLeakage = (orderId, description, photos, reportedBy) => 
  api.post(`/orders/${orderId}/report_leakage`, { description, photos, reportedBy })
export const processAfterSales = (recordId, processorId) => 
  api.post(`/after_sales/${recordId}/process`, { processorId })
export const rejectAfterSales = (recordId, reason, rejectedBy) => 
  api.post(`/after_sales/${recordId}/reject`, { reason, rejectedBy })
export const judgeResponsibility = (orderId, request, createdBy) => 
  api.post(`/orders/${orderId}/judge_responsibility`, { ...request, createdBy })
export const appealResponsibility = (resultId, appealReason) => 
  api.post(`/responsibility/${resultId}/appeal`, { appealReason })
export const finalizeResponsibility = (resultId, finalReason) => 
  api.post(`/responsibility/${resultId}/finalize`, { finalReason })
export const reworkOrder = (orderId, photos) => api.post(`/orders/${orderId}/rework`, { photos })