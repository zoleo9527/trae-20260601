import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
})

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => axiosInstance.post('/users/login', data),
  createUser: (data) => axiosInstance.post('/users', data),
  getUsers: (params) => axiosInstance.get('/users', { params })
}

export const activityAPI = {
  create: (data) => axiosInstance.post('/activities', data),
  list: (params) => axiosInstance.get('/activities', { params }),
  get: (id) => axiosInstance.get(`/activities/${id}`),
  update: (id, data) => axiosInstance.put(`/activities/${id}`, data)
}

export const applicationAPI = {
  create: (data) => axiosInstance.post('/applications', data),
  list: (params) => axiosInstance.get('/applications', { params }),
  get: (id) => axiosInstance.get(`/applications/${id}`),
  update: (id, data) => axiosInstance.put(`/applications/${id}`, data)
}

export const postAPI = {
  create: (data) => axiosInstance.post('/posts', data),
  list: (params) => axiosInstance.get('/posts', { params }),
  get: (id) => axiosInstance.get(`/posts/${id}`),
  update: (id, data) => axiosInstance.put(`/posts/${id}`, data),
  assign: (postId, applicationId) => axiosInstance.put(`/posts/${postId}/assign/${applicationId}`)
}

export const exceptionAPI = {
  create: (data) => axiosInstance.post('/exceptions', data),
  list: (params) => axiosInstance.get('/exceptions', { params }),
  get: (id) => axiosInstance.get(`/exceptions/${id}`),
  update: (id, data) => axiosInstance.put(`/exceptions/${id}`, data)
}

export const attachmentAPI = {
  upload: (data) => axiosInstance.post('/attachments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (params) => axiosInstance.get('/attachments', { params }),
  delete: (id) => axiosInstance.delete(`/attachments/${id}`)
}

export default axiosInstance