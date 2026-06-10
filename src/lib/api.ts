import type { User, Complaint, ComplaintDetail, ParkingLog, MonthlyRental, GateAnomaly, EvidenceReview } from '../../shared/types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers as Record<string, string>,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('未授权')
  }
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '请求失败')
  }
  return json.data as T
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ComplaintListResponse {
  items: Complaint[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BatchResponse {
  updated: number
}

export function login(username: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getComplaints(params?: Record<string, string | number>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, String(v))
    })
  }
  const qs = searchParams.toString()
  return request<ComplaintListResponse>(`/api/complaints${qs ? `?${qs}` : ''}`)
}

export function getComplaintDetail(id: number) {
  return request<ComplaintDetail>(`/api/complaints/${id}`)
}

export function createComplaint(data: {
  type: string
  plate_number?: string
  description: string
  parking_lot_id?: number
  deadline: string
}) {
  return request<Complaint>('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateComplaint(id: number, data: {
  status?: string
  assigneeId?: number
  appealReason?: string
}) {
  return request<Complaint>(`/api/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function batchOperation(data: {
  ids: number[]
  action: 'assign' | 'process' | 'close'
  assigneeId?: number
}) {
  return request<Complaint[]>('/api/complaints/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getParkingLogs(params?: {
  plateNumber?: string
  startTime?: string
  endTime?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.set(k, v)
    })
  }
  const qs = searchParams.toString()
  return request<ParkingLog[]>(`/api/evidence/parking-logs${qs ? `?${qs}` : ''}`)
}

export function getMonthlyRentals(params?: {
  plateNumber?: string
  status?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.set(k, v)
    })
  }
  const qs = searchParams.toString()
  return request<MonthlyRental[]>(`/api/evidence/monthly-rentals${qs ? `?${qs}` : ''}`)
}

export function getGateAnomalies(params?: {
  gateId?: string
  startTime?: string
  endTime?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.set(k, v)
    })
  }
  const qs = searchParams.toString()
  return request<GateAnomaly[]>(`/api/evidence/gate-anomalies${qs ? `?${qs}` : ''}`)
}

export function getComplaintEvidence(complaintId: number) {
  return request<{
    parking_logs: ParkingLog[]
    monthly_rentals: MonthlyRental[]
    gate_anomalies: GateAnomaly[]
  }>(`/api/evidence/complaint/${complaintId}`)
}

export function getUsers(role?: string) {
  const searchParams = new URLSearchParams()
  if (role) searchParams.set('role', role)
  const qs = searchParams.toString()
  return request<User[]>(`/api/users${qs ? `?${qs}` : ''}`)
}

export function getEvidenceReviews(params?: {
  status?: string
  complaintId?: number
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, String(v))
    })
  }
  const qs = searchParams.toString()
  return request<(EvidenceReview & { complaint_no?: string; complaint_type?: string; complaint_status?: string; complaint_description?: string })[]>(`/api/evidence/reviews${qs ? `?${qs}` : ''}`)
}

export function createEvidenceReview(data: {
  complaintId: number
  reviewerId: number
  status?: string
  blockedReason?: string
}) {
  return request<EvidenceReview>('/api/evidence/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateEvidenceReview(id: number, data: {
  status?: string
  blockedReason?: string
}) {
  return request<EvidenceReview>(`/api/evidence/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
