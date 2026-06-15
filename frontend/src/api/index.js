import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: (username, password) => api.post('/token', new URLSearchParams({ username, password }))
}

export const repairs = {
  createOrder: (data) => api.post('/repairs', data),
  getOrders: (params) => api.get('/repairs', { params }),
  getOrder: (id) => api.get(`/repairs/${id}`),
  updateOrder: (id, data) => api.put(`/repairs/${id}`, data),
  deleteOrder: (id) => api.delete(`/repairs/${id}`),
  getRecords: (orderId) => api.get(`/repairs/${orderId}/records`),
  createRecord: (orderId, data) => api.post(`/repairs/${orderId}/records`, data)
}

export const spareParts = {
  createPart: (data) => api.post('/spare_parts', data),
  getParts: (params) => api.get('/spare_parts', { params }),
  getPart: (id) => api.get(`/spare_parts/${id}`),
  updatePart: (id, data) => api.put(`/spare_parts/${id}`, data),
  deletePart: (id) => api.delete(`/spare_parts/${id}`),
  issuePart: (orderId, data) => api.post(`/spare_parts/issue/${orderId}`, data),
  getOrderIssues: (orderId) => api.get(`/spare_parts/issue/${orderId}`),
  returnPart: (issueId, data) => api.post(`/spare_parts/return/${issueId}`, data),
  getCategories: () => api.get('/spare_parts/categories')
}

export const records = {
  getAllRecords: (params) => api.get('/records/orders', { params }),
  getDailySummary: (date) => api.get(`/records/daily_summary/${date}`),
  getShiftReport: (shift) => api.get(`/records/shift_report/${shift}`),
  batchUpdateStatus: (data) => api.post('/records/batch/update_status', data),
  createShiftHandover: (data) => api.post('/records/shift_handover', data),
  getShiftHandovers: (params) => api.get('/records/shift_handover', { params }),
  getShiftHandover: (id) => api.get(`/records/shift_handover/${id}`),
  createNotification: (data) => api.post('/records/notifications', data),
  getNotifications: (userId, params) => api.get(`/records/notifications/${userId}`, { params }),
  markNotificationRead: (id) => api.put(`/records/notifications/${id}/read`),
  exportRecords: (date) => api.get(`/records/export/${date}`)
}

export default api
