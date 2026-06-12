import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      } else if (error.response.status === 403) {
        ElMessage.error('权限不足，无法执行此操作')
      } else if (error.response.status === 400) {
        ElMessage.error(error.response.data?.message || '请求参数错误')
      } else if (error.response.status === 404) {
        ElMessage.error('资源不存在')
      } else {
        ElMessage.error(error.response.data?.message || '服务器错误')
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => request.post('/auth/login', data)
}

export const propertyApi = {
  findAll: (params) => request.get('/properties', { params }),
  findOne: (id) => request.get(`/properties/${id}`),
  updateStatus: (id, status) => request.patch(`/properties/${id}/status`, { status }),
  getStatusHistory: (id) => request.get(`/properties/${id}/history`)
}

export const viewingApi = {
  findAll: (params) => request.get('/viewings', { params }),
  addFeedback: (id, data) => request.patch(`/viewings/${id}/feedback`, data),
  getPropertySummary: (propertyId) => request.get(`/viewings/summary/${propertyId}`)
}

export const handoverApi = {
  submit: (data) => request.post('/handovers', data),
  findAll: (params) => request.get('/handovers', { params }),
  findOne: (id) => request.get(`/handovers/${id}`),
  confirm: (id) => request.patch(`/handovers/${id}/confirm`),
  dispute: (id, data) => request.patch(`/handovers/${id}/dispute`, data),
  resolve: (id, resolution) => request.patch(`/handovers/${id}/resolve`, { resolution }),
  getDisputes: () => request.get('/handovers/disputes'),
  getAuditTrail: (id) => request.get(`/handovers/${id}/audit-trail`)
}

export const keyTransferApi = {
  initiateTransfer: (data) => request.post('/key-transfers', data),
  findAll: (params) => request.get('/key-transfers', { params }),
  findOne: (id) => request.get(`/key-transfers/${id}`),
  confirmReception: (id) => request.patch(`/key-transfers/${id}/receive`),
  returnKeys: (id, data) => request.patch(`/key-transfers/${id}/return`, data),
  getByHandover: (handoverId) => request.get(`/key-transfers/handover/${handoverId}`),
  getTransferHistory: (id) => request.get(`/key-transfers/${id}/history`),
  getTransferTimeline: (id) => request.get(`/key-transfers/${id}/timeline`)
}

export const depositApi = {
  initiate: (data) => request.post('/deposits', data),
  findAll: (params) => request.get('/deposits', { params }),
  findOne: (id) => request.get(`/deposits/${id}`),
  confirm: (id) => request.patch(`/deposits/${id}/confirm`),
  dispute: (id, data) => request.patch(`/deposits/${id}/dispute`, data),
  resolve: (id, resolution) => request.patch(`/deposits/${id}/resolve`, resolution),
  markSettled: (id) => request.patch(`/deposits/${id}/settle`),
  getDisputes: () => request.get('/deposits/disputes')
}

export const auditApi = {
  query: (params) => request.get('/audit', { params })
}

export const overviewApi = {
  getDisputeOverview: () => request.get('/overview/disputes'),
  getRoleDashboard: () => request.get('/overview/dashboard')
}

export default request
