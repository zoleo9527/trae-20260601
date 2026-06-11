import { useAuthStore } from '~/stores/auth'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  params?: Record<string, any>
}

export async function apiRequest<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const authStore = useAuthStore()
  
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase
  
  let fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  
  if (options.params) {
    const searchParams = new URLSearchParams(options.params)
    fullUrl += `?${searchParams.toString()}`
  }

  const response = await $fetch<{ success: boolean; message: string; data: T }>(fullUrl, {
    method: options.method || 'GET',
    headers: authStore.getAuthHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
    onResponse({ response }) {
      if (!response.ok) {
        throw new Error(response._data?.message || '请求失败')
      }
    }
  })

  if (!response.success) {
    throw new Error(response.message)
  }

  return response.data
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'PENDING': 'bg-status-pending text-white',
    'IN_PROGRESS': 'bg-status-progress text-white',
    'SUBMITTED': 'bg-status-submitted text-white',
    'REVIEWING': 'bg-status-reviewing text-white',
    'APPROVED': 'bg-status-approved text-white',
    'CONFIRMED': 'bg-status-confirmed text-white',
    'REJECTED': 'bg-status-rejected text-white',
    'STUCK': 'bg-status-stuck text-white',
    'CUSTOMER_REVIEWING': 'bg-status-customer text-white',
    'REVISED': 'bg-status-revised text-white'
  }
  return map[status] || 'bg-gray-500 text-white'
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    'PENDING': '待处理',
    'IN_PROGRESS': '处理中',
    'SUBMITTED': '已提交',
    'REVIEWING': '审核中',
    'APPROVED': '已通过',
    'CONFIRMED': '已确认',
    'REJECTED': '已拒绝',
    'STUCK': '已卡住',
    'CUSTOMER_REVIEWING': '客户审核中',
    'REVISED': '已修改重提'
  }
  return map[status] || status
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getRoleText(role: string): string {
  const map: Record<string, string> = {
    'PROJECT_MANAGER': '项目经理',
    'CONSTRUCTION_LEADER': '施工队长',
    'AFTER_SALES_ENGINEER': '售后工程师'
  }
  return map[role] || role
}
