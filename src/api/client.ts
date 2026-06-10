import type { MaintenanceOrder, OrderDetail, OrderNote, Role, RoleInfo, BatchError } from '@/types'
export type { BatchError }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data
}

export async function fetchOrders(params?: { role?: Role; status?: string }): Promise<MaintenanceOrder[]> {
  const query = new URLSearchParams()
  if (params?.role) query.set('role', params.role)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return request<MaintenanceOrder[]>(`/api/orders${qs ? `?${qs}` : ''}`)
}

export async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  return request<OrderDetail>(`/api/orders/${id}`)
}

export async function checkinOrder(
  id: string,
  anomaly: boolean,
  anomalyDesc?: string,
): Promise<MaintenanceOrder> {
  return request<MaintenanceOrder>(`/api/orders/${id}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ anomaly, anomalyDesc }),
  })
}

export async function advanceOrder(id: string): Promise<MaintenanceOrder> {
  return request<MaintenanceOrder>(`/api/orders/${id}/advance`, {
    method: 'POST',
  })
}

export async function reviewOrder(
  id: string,
  approved: boolean,
): Promise<MaintenanceOrder> {
  return request<MaintenanceOrder>(`/api/orders/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ approved }),
  })
}

export async function addNote(
  id: string,
  role: Role,
  content: string,
): Promise<OrderNote> {
  return request<OrderNote>(`/api/orders/${id}/note`, {
    method: 'POST',
    body: JSON.stringify({ role, content }),
  })
}

export async function batchCheckin(ids: string[], anomaly?: boolean, anomalyDesc?: string): Promise<{ checkedIn: string[]; errors: BatchError[] }> {
  return request('/api/orders/batch/checkin', {
    method: 'POST',
    body: JSON.stringify({ ids, anomaly, anomalyDesc }),
  })
}

export async function batchReview(ids: string[], approved: boolean): Promise<{ reviewed: string[]; errors: BatchError[] }> {
  return request('/api/orders/batch/review', {
    method: 'POST',
    body: JSON.stringify({ ids, approved }),
  })
}

export async function fetchRoles(): Promise<RoleInfo[]> {
  return request<RoleInfo[]>('/api/roles')
}
