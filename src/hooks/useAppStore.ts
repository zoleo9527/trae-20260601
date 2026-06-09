import { create } from 'zustand'
import type {
  Delivery,
  ProblemRecord,
  CustomerContact,
  ProblemDetail,
  Notification,
  Role,
} from '../../shared/types'
import { snakeToCamel } from '@/lib/transform'

interface CurrentUser {
  id: string
  name: string
  role: Role
}

interface AppState {
  currentUser: CurrentUser
  setCurrentUser: (user: CurrentUser) => void

  deliveries: Delivery[]
  loadDeliveries: (params?: { status?: string; keyword?: string }) => Promise<void>

  problems: ProblemRecord[]
  loadProblems: (params?: { status?: string; problemType?: string; keyword?: string }) => Promise<void>

  problemDetail: ProblemDetail | null
  loadProblemDetail: (id: string) => Promise<void>
  createProblem: (data: any) => Promise<void>
  updateProblem: (id: string, data: any) => Promise<void>
  returnProblem: (id: string, data: any) => Promise<void>
  supplementProblem: (id: string, data: any) => Promise<void>
  reviewProblem: (id: string, data: any) => Promise<void>
  changeResponsible: (id: string, data: any) => Promise<void>

  contacts: CustomerContact[]
  loadContacts: (params?: { problemRecordId?: string; trackingNumber?: string }) => Promise<void>
  createContact: (data: any) => Promise<void>
  updateContact: (id: string, data: any) => Promise<void>

  notifications: Notification[]
  unreadCount: number
  loadNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>

  localLogs: string[]
  addLocalLog: (log: string) => void
}

const API_BASE = '/api'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data: T; unreadCount?: number }> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (json.success && json.data !== undefined) {
    json.data = snakeToCamel(json.data)
  }
  return json
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: { id: 'CS001', name: '王丽娟', role: 'station_cs' },
  setCurrentUser: (user) => set({ currentUser: user }),

  deliveries: [],
  loadDeliveries: async (params) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.keyword) query.set('keyword', params.keyword)
    const result = await apiFetch<Delivery[]>(`/deliveries?${query.toString()}`)
    if (result.success) set({ deliveries: result.data })
  },

  problems: [],
  loadProblems: async (params) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.problemType) query.set('problemType', params.problemType)
    if (params?.keyword) query.set('keyword', params.keyword)
    const result = await apiFetch<ProblemRecord[]>(`/problems?${query.toString()}`)
    if (result.success) set({ problems: result.data })
  },

  problemDetail: null,
  loadProblemDetail: async (id) => {
    const result = await apiFetch<ProblemDetail>(`/problems/${id}`)
    if (result.success) set({ problemDetail: result.data })
  },

  createProblem: async (data) => {
    const result = await apiFetch<ProblemRecord>('/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (result.success) {
      get().addLocalLog(`[问题件登记] ${data.trackingNumber} 登记成功`)
      await get().loadProblems()
      await get().loadNotifications()
    }
  },

  updateProblem: async (id, data) => {
    const result = await apiFetch<ProblemRecord>(`/problems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[问题件变更] ${id.substring(0, 8)} 已更新`)
      await get().loadProblems()
      if (get().problemDetail?.id === id) await get().loadProblemDetail(id)
      await get().loadNotifications()
    }
  },

  returnProblem: async (id, data) => {
    const result = await apiFetch<ProblemRecord>(`/problems/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[退回确认] 问题件 ${id.substring(0, 8)} 已退回`)
      await get().loadProblems()
      if (get().problemDetail?.id === id) await get().loadProblemDetail(id)
      await get().loadNotifications()
    }
  },

  supplementProblem: async (id, data) => {
    const result = await apiFetch<ProblemRecord>(`/problems/${id}/supplement`, {
      method: 'POST',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[补录] 问题件 ${id.substring(0, 8)} 补录完成`)
      await get().loadProblems()
      if (get().problemDetail?.id === id) await get().loadProblemDetail(id)
      await get().loadNotifications()
    }
  },

  reviewProblem: async (id, data) => {
    const result = await apiFetch<ProblemRecord>(`/problems/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[复核] 问题件 ${id.substring(0, 8)} 复核${data.action === 'approve' ? '通过' : data.action === 'reject' ? '退回' : '提交'}`)
      await get().loadProblems()
      if (get().problemDetail?.id === id) await get().loadProblemDetail(id)
      await get().loadNotifications()
    }
  },

  changeResponsible: async (id, data) => {
    const result = await apiFetch<ProblemRecord>(`/problems/${id}/change-responsible`, {
      method: 'POST',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[责任人变更] 问题件 ${id.substring(0, 8)} 责任人变更为 ${data.newResponsibleName}`)
      await get().loadProblems()
      if (get().problemDetail?.id === id) await get().loadProblemDetail(id)
      await get().loadNotifications()
    }
  },

  contacts: [],
  loadContacts: async (params) => {
    const query = new URLSearchParams()
    if (params?.problemRecordId) query.set('problemRecordId', params.problemRecordId)
    if (params?.trackingNumber) query.set('trackingNumber', params.trackingNumber)
    const result = await apiFetch<CustomerContact[]>(`/contacts?${query.toString()}`)
    if (result.success) set({ contacts: result.data })
  },

  createContact: async (data) => {
    const result = await apiFetch<CustomerContact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (result.success) {
      get().addLocalLog(`[客户联系] ${data.trackingNumber} 添加联系记录`)
      await get().loadContacts({ problemRecordId: data.problemRecordId })
      await get().loadProblems()
      if (get().problemDetail?.id === data.problemRecordId) await get().loadProblemDetail(data.problemRecordId)
      await get().loadNotifications()
    }
  },

  updateContact: async (id, data) => {
    const result = await apiFetch<CustomerContact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, ...get().currentUser }),
    })
    if (result.success) {
      get().addLocalLog(`[客户联系] 联系记录 ${id.substring(0, 8)} 已更新`)
    }
  },

  notifications: [],
  unreadCount: 0,
  loadNotifications: async () => {
    const result = await apiFetch<Notification[]>('/notifications')
    if (result.success) set({ notifications: result.data, unreadCount: result.unreadCount || 0 })
  },

  markNotificationRead: async (id) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
    await get().loadNotifications()
  },

  markAllRead: async () => {
    await apiFetch('/notifications/read-all', { method: 'POST' })
    await get().loadNotifications()
  },

  localLogs: [],
  addLocalLog: (log) => {
    const ts = new Date().toLocaleTimeString()
    set((state) => ({ localLogs: [`${ts} ${log}`, ...state.localLogs].slice(0, 100) }))
  },
}))
