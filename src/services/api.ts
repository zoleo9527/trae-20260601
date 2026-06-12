import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      const message = error.response.data?.error || error.response.data?.message || '请求失败'
      return Promise.reject(new Error(message))
    }
    return Promise.reject(new Error('网络错误，请稍后重试'))
  }
)

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return '未知错误'
}

export default api