import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
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

instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const api = {
  get: <T>(url: string, params?: any) => instance.get<T, T>(url, { params }),
  post: <T>(url: string, data?: any) => instance.post<T, T>(url, data),
  put: <T>(url: string, data?: any, params?: any) => instance.put<T, T>(url, data, { params }),
  delete: <T>(url: string) => instance.delete<T, T>(url)
}

export default instance