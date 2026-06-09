const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data
}

export const api = {
  containers: {
    list: (status?: string) => request<any[]>(`/containers${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<any>(`/containers/${id}`),
    stats: () => request<any>('/containers/stats'),
    create: (data: any) => request<any>('/containers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/containers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, extra?: Record<string, string>) => request<any>(`/containers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
    batchStatus: (ids: string[], status: string, extra?: Record<string, string>) => request<any>('/containers/batch-status', { method: 'POST', body: JSON.stringify({ ids, status, ...extra }) }),
    misplacedList: () => request<any[]>('/containers/misplaced'),
    relocateHistory: () => request<any[]>('/containers/relocate-history'),
    relocateMisplaced: (id: string, data: any) => request<any>(`/containers/${id}/relocate-misplaced`, { method: 'POST', body: JSON.stringify(data) }),
  },
  gateRecords: {
    list: (containerId?: string) => request<any[]>(`/gate-records${containerId ? `?containerId=${containerId}` : ''}`),
    create: (data: any) => request<any>('/gate-records', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/gate-records/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  yardSlots: {
    list: () => request<any[]>('/yard-slots'),
    update: (id: string, data: any) => request<any>(`/yard-slots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    relocate: (containerId: string, fromSlotId: string, toSlotId: string) => request<any>('/yard-slots/relocate', { method: 'POST', body: JSON.stringify({ containerId, fromSlotId, toSlotId }) }),
  },
  overstay: {
    list: () => request<any[]>('/overstay'),
    updateStatus: (id: string, status: string, extra?: Record<string, string>) => request<any>(`/overstay/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
    notify: (id: string, extra?: Record<string, string>) => request<any>(`/overstay/${id}/notify`, { method: 'POST', body: JSON.stringify({ ...extra }) }),
    generateFee: (id: string, extra?: Record<string, any>) => request<any>(`/overstay/${id}/generate-fee`, { method: 'POST', body: JSON.stringify({ ...extra }) }),
  },
  fees: {
    list: (params?: { reviewStatus?: string; containerId?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.reviewStatus) searchParams.set('reviewStatus', params.reviewStatus)
      if (params?.containerId) searchParams.set('containerId', params.containerId)
      const qs = searchParams.toString()
      return request<any[]>(`/fees${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<any>(`/fees/${id}`),
    review: (id: string, data: any) => request<any>(`/fees/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
    dispute: (id: string, data: any) => request<any>(`/fees/${id}/dispute`, { method: 'POST', body: JSON.stringify(data) }),
  },
  inspections: {
    list: () => request<any[]>('/inspections'),
    create: (data: any) => request<any>('/inspections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/inspections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    notify: (id: string) => request<any>(`/inspections/${id}/notify`, { method: 'POST' }),
    missedNotifications: () => request<any[]>('/inspections/missed-notifications'),
  },
  timeline: {
    getByContainer: (containerId: string) => request<any[]>(`/timeline/container/${containerId}`),
  },
  attachments: {
    list: (containerId: string) => request<any[]>(`/attachments/container/${containerId}`),
    upload: (containerId: string, data: any) => request<any>(`/attachments/container/${containerId}`, { method: 'POST', body: JSON.stringify(data) }),
  },
}
