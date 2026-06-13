import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: (data) => apiClient.post('/auth/login', data),
    register: (data) => apiClient.post('/auth/register', data),
    getMe: () => apiClient.get('/auth/me')
  },

  laborDemands: {
    create: (data) => apiClient.post('/labor-demands', data),
    list: (params) => apiClient.get('/labor-demands', { params }),
    getById: (id) => apiClient.get(`/labor-demands/${id}`),
    update: (id, data) => apiClient.put(`/labor-demands/${id}`, data),
    updateStatus: (id, data) => apiClient.put(`/labor-demands/${id}/status`, data),
    delete: (id) => apiClient.delete(`/labor-demands/${id}`)
  },

  candidates: {
    create: (data) => apiClient.post('/candidates', data),
    list: (params) => apiClient.get('/candidates', { params }),
    getById: (id) => apiClient.get(`/candidates/${id}`),
    update: (id, data) => apiClient.put(`/candidates/${id}`, data),
    updateStatus: (id, data) => apiClient.put(`/candidates/${id}/status`, data),
    delete: (id) => apiClient.delete(`/candidates/${id}`)
  },

  matchings: {
    create: (data) => apiClient.post('/matchings', data),
    list: (params) => apiClient.get('/matchings', { params }),
    getById: (id) => apiClient.get(`/matchings/${id}`),
    confirm: (id, data) => apiClient.put(`/matchings/${id}/confirm`, data),
    return: (id, data) => apiClient.post(`/matchings/${id}/return`, data),
    supplement: (id, data) => apiClient.post(`/matchings/${id}/supplement`, data),
    review: (id, data) => apiClient.post(`/matchings/${id}/review`, data),
    delete: (id) => apiClient.delete(`/matchings/${id}`),
    batchConfirm: (data) => apiClient.post('/matchings/batch/confirm', data),
    batchReturn: (data) => apiClient.post('/matchings/batch/return', data)
  },

  returnRecords: {
    list: (params) => apiClient.get('/return-records', { params }),
    getById: (id) => apiClient.get(`/return-records/${id}`),
    handle: (id, data) => apiClient.put(`/return-records/${id}/handle`, data)
  },

  statusHistories: {
    list: (params) => apiClient.get('/status-histories', { params }),
    getById: (id) => apiClient.get(`/status-histories/${id}`)
  },

  attachments: {
    create: (formData) => apiClient.post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params) => apiClient.get('/attachments', { params }),
    getById: (id) => apiClient.get(`/attachments/${id}`),
    delete: (id) => apiClient.delete(`/attachments/${id}`)
  },

  dashboard: {
    getStats: () => apiClient.get('/dashboard/stats'),
    getTodoList: (params) => apiClient.get('/dashboard/todo-list', { params })
  }
}
