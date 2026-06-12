import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const api = {
  getStats: () => request.get('/stats'),

  getUsers: (params) => request.get('/users', { params }),
  getCurrentUser: () => request.get('/users/current'),

  getCustomers: (params) => request.get('/customers', { params }),
  getCustomer: (id) => request.get(`/customers/${id}`),

  getTaxFilings: (params) => request.get('/tax-filings', { params }),
  getTaxFiling: (id) => request.get(`/tax-filings/${id}`),
  createTaxFiling: (data) => request.post('/tax-filings', data),
  updateFilingStatus: (id, data) => request.put(`/tax-filings/${id}/status`, data),
  updateFilingRemark: (id, data) => request.put(`/tax-filings/${id}/remark`, data),
  filingAction: (id, actionType, data) => request.post(`/tax-filings/${id}/action/${actionType}`, data),

  getExceptions: (params) => request.get('/exceptions', { params }),
  getExceptionStats: () => request.get('/exceptions/stats'),
  getException: (id) => request.get(`/exceptions/${id}`),
  createException: (data) => request.post('/exceptions', data),
  updateExceptionStatus: (id, data) => request.put(`/exceptions/${id}/status`, data),
  updateExceptionRemark: (id, data) => request.put(`/exceptions/${id}/remark`, data),
  exceptionAction: (id, actionType, data) => request.post(`/exceptions/${id}/action/${actionType}`, data),

  getLogs: (params) => request.get('/logs', { params }),
}

export default request
