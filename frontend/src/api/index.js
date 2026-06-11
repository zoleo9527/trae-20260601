import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    config.headers['X-User-Id'] = user.id
  }
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.detail || '请求失败'
    ElMessage.error(msg)
    if (error.response?.status === 401 || error.response?.status === 403) {
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default api
