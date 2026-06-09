import type {
  Contract,
  ContractDetail,
  Archive,
  ArchiveDetail,
  Note,
  AppNotification,
  RecentItem,
  DashboardData,
  PaginatedResponse,
  Role,
} from '@/lib/types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  dashboard: {
    get: (role: Role) =>
      request<DashboardData>(`/dashboard?role=${role}`),
  },

  contracts: {
    list: (params?: { status?: string; createdBy?: string; search?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.createdBy) qs.set('createdBy', params.createdBy)
      if (params?.search) qs.set('search', params.search)
      if (params?.page) qs.set('page', String(params.page))
      if (params?.limit) qs.set('limit', String(params.limit))
      return request<PaginatedResponse<Contract>>(`/contracts?${qs.toString()}`)
    },
    get: (id: string) =>
      request<ContractDetail>(`/contracts/${id}`),
    create: (data: Record<string, string>) =>
      request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, string>) =>
      request<Contract>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addNote: (id: string, data: { content: string; createdBy: string; createdByRole: Role; source?: string }) =>
      request<Note>(`/contracts/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    getChanges: (id: string) =>
      request<Note[]>(`/contracts/${id}/changes`),
  },

  archives: {
    list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.search) qs.set('search', params.search)
      if (params?.page) qs.set('page', String(params.page))
      if (params?.limit) qs.set('limit', String(params.limit))
      return request<PaginatedResponse<Archive>>(`/archives?${qs.toString()}`)
    },
    get: (id: string) =>
      request<ArchiveDetail>(`/archives/${id}`),
    create: (contractId: string) =>
      request<Archive>('/archives', { method: 'POST', body: JSON.stringify({ contractId }) }),
    update: (id: string, data: Record<string, string>) =>
      request<Archive>(`/archives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    returnArchive: (id: string, data: { reason: string; returnedBy: string; returnedByRole: Role }) =>
      request<Archive>(`/archives/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  },

  notifications: {
    list: (targetRole: Role) =>
      request<AppNotification[]>(`/notifications?targetRole=${targetRole}`),
    markRead: (id: string) =>
      request<AppNotification>(`/notifications/${id}/read`, { method: 'POST' }),
  },

  recent: {
    list: (userId: string) =>
      request<RecentItem[]>(`/recent?userId=${userId}`),
    add: (data: { userId: string; itemType: string; itemId: string }) =>
      request<RecentItem>('/recent', { method: 'POST', body: JSON.stringify(data) }),
  },

  batch: {
    createContracts: (data: { contracts: Record<string, string>[]; createdBy: string }) =>
      request<{ count: number; data: Contract[] }>('/batch/contracts', { method: 'POST', body: JSON.stringify(data) }),
    supplement: (data: { contractIds: string[]; note: string; createdBy: string; createdByRole: Role }) =>
      request<{ count: number; data: Note[] }>('/batch/supplement', { method: 'POST', body: JSON.stringify(data) }),
  },
}
