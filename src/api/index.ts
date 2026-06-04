import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ProcessFollowupRequest } from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const user = localStorage.getItem('user')
  if (user) {
    const u = JSON.parse(user)
    config.headers['X-User-ID'] = u.id
    config.headers['X-User-Role'] = u.role
    config.headers['X-User-Name'] = encodeURIComponent(u.name)
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    ElMessage.error(error.response?.data?.detail || '请求失败')
    return Promise.reject(error)
  }
)

export default {
  getDashboardStats() {
    return request.get('/dashboard/stats')
  },

  getMedicationTasks(params?: any) {
    return request.get('/medication', { params })
  },

  getMedicationDetail(id: string) {
    return request.get(`/medication/${id}`)
  },

  processMedication(id: string, data: any) {
    return request.post(`/medication/${id}/process`, data)
  },

  getFollowupTasks(params?: any) {
    return request.get('/followup', { params })
  },

  getFollowupDetail(id: string) {
    return request.get(`/followup/${id}`)
  },

  processFollowup(id: string, data: ProcessFollowupRequest) {
    return request.post(`/followup/${id}/process`, data)
  },

  getOperationLogs(taskId: string) {
    return request.get(`/operation-logs`, { params: { taskId } })
  }
}
