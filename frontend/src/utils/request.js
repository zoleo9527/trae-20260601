import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = userStore.token
      config.headers['X-User-Id'] = userStore.userId
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.clearUser()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
