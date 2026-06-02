import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data)
}

export const packageAPI = {
  getList: (params) => api.get('/packages', { params }),
  getDetail: (packageNo) => api.get(`/packages/${packageNo}`),
  create: (data) => api.post('/packages', data),
  track: (packageNo, data) => api.post(`/packages/${packageNo}/track`, data)
}

export const batchAPI = {
  getList: (params) => api.get('/batches', { params }),
  getDetail: (batchNo) => api.get(`/batches/${batchNo}`),
  create: (data) => api.post('/batches', data),
  complete: (batchNo, data) => api.post(`/batches/${batchNo}/complete`, data),
  addPackages: (batchNo, packageIds) => api.post(`/batches/${batchNo}/packages`, { package_ids: packageIds })
}

export const exceptionAPI = {
  getList: (params) => api.get('/exceptions', { params }),
  create: (data) => api.post('/exceptions', data),
  resolve: (id, resolution) => api.put(`/exceptions/${id}/resolve`, { resolution })
}

export const recallAPI = {
  getList: () => api.get('/recalls'),
  getDetail: (recallNo) => api.get(`/recalls/${recallNo}`),
  create: (data) => api.post('/recalls', data),
  recoverItem: (recallNo, packageId) => api.put(`/recalls/${recallNo}/items/${packageId}/recover`)
}

export const departmentAPI = {
  getList: () => api.get('/departments')
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
}

export default api
