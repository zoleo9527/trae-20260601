const BASE_URL = ''

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.message || `HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }
  return json as T
}

export interface LoginResponse {
  token: string
  role: 'gate' | 'dispatch' | 'service'
  name: string
}

export interface MeResponse {
  id: number
  username: string
  role: string
  name: string
}

export interface Container {
  id: number
  container_no: string
  vessel: string
  voyage: string
  target_port: string
  yard_slot: string | null
  expected_slot: string | null
  status: string
  entered_at: string
  free_storage_until: string | null
  exited_at: string | null
}

export interface TimelineEvent {
  type: string
  time: string
  detail: string
  data?: unknown
}

export interface ContainerDetail {
  container: Container
  inspections: Inspection[]
  moveTasks: MoveTask[]
  problems: ProblemOrder[]
  timeline: TimelineEvent[]
}

export interface ContainersListResponse {
  list: Container[]
  total: number
  page: number
  size: number
}

export interface Inspection {
  id: number
  container_id: number
  container_no?: string
  yard_slot?: string
  type: 'open' | 'full' | 'random'
  status: 'planned' | 'notified' | 'executing' | 'completed'
  planned_at: string
  notified_at: string | null
  notify_method: 'sms' | 'email' | 'phone' | null
  step: 'open_box' | 'unpack' | 'repack' | 'result'
  result: 'released' | 'abnormal' | 'detained' | null
  completed_at: string | null
  created_at?: string
}

export interface MoveTask {
  id: number
  container_id: number
  container_no?: string
  source_inspection_id: number | null
  from_slot: string
  to_slot: string
  reason: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface MoveTaskHistory {
  task: MoveTask
  logs: OperationLog[]
}

export interface CauseChainItem {
  event: string
  time: string
  detail: string
}

export interface ProblemOrder {
  id: number
  container_id: number
  container_no?: string
  yard_slot?: string
  expected_slot?: string
  inspection_id: number | null
  move_task_id: number | null
  type: 'misplaced' | 'overdue' | 'missed_notify' | 'detained' | 'stuck_inspecting' | 'stuck_move' | 'expiring_soon' | 'no_inspection' | 'yard_stagnation'
  severity: 'critical' | 'warning'
  status: 'open' | 'rescheduled' | 'supplemented' | 'rejected' | 'resolved'
  description: string
  cause: string | null
  cause_chain: string
  action_data: string
  detected_at: string
  resolved_at: string | null
  updated_at: string | null
}

export interface ProblemDetail {
  problem: ProblemOrder
  container: Container
  inspection: Inspection | null
  moveTask: MoveTask | null
  relatedLogs: OperationLog[]
}

export interface OperationLog {
  id: number
  user_id: number | null
  username: string | null
  role: string | null
  action: string
  container_no: string | null
  detail: string | null
  created_at: string
}

export interface LogsListResponse {
  list: OperationLog[]
  total: number
  page: number
  size: number
}

export interface StuckOrder {
  id: number
  type: string
  severity?: string
  container_no: string
  yard_slot?: string
  expected_slot?: string
  description: string
  cause?: string | null
  cause_chain?: string
  inspection_id?: number | null
  move_task_id?: number | null
  status?: string
  detected_at?: string
  updated_at?: string | null
}

export interface DashboardData {
  pendingCount: number
  stuckOrders: StuckOrder[]
  recentDetections: StuckOrder[]
  pendingActions: Record<string, unknown>
  lastDetectedAt: string
  typeBreakdown: Record<string, number>
  todayStats: {
    entered: number
    exited: number
    inspections: number
    moves: number
  }
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<MeResponse>('/api/auth/me'),
}

export const containerApi = {
  list: (params?: { status?: string; search?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.size) query.set('size', String(params.size))
    const qs = query.toString()
    return request<ContainersListResponse>(`/api/containers${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => request<ContainerDetail>(`/api/containers/${id}`),
  create: (data: { container_no: string; vessel: string; voyage: string; target_port: string; yard_slot?: string; free_storage_until?: string }) =>
    request<Container>('/api/containers', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, data: { status: string; remark?: string }) =>
    request<Container>(`/api/containers/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const inspectionApi = {
  list: (params?: { status?: string; type?: string; container_id?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.type) query.set('type', params.type)
    if (params?.container_id) query.set('container_id', String(params.container_id))
    const qs = query.toString()
    return request<Inspection[]>(`/api/inspections${qs ? `?${qs}` : ''}`)
  },
  create: (data: { container_id: number; type: 'open' | 'full' | 'random'; planned_at: string }) =>
    request<Inspection>('/api/inspections', { method: 'POST', body: JSON.stringify(data) }),
  execute: (id: number, data: { step: 'open_box' | 'unpack' | 'repack' | 'result'; result?: 'released' | 'abnormal' | 'detained'; remark?: string }) =>
    request<Inspection>(`/api/inspections/${id}/execute`, { method: 'PUT', body: JSON.stringify(data) }),
  notify: (id: number, data: { notify_method: 'sms' | 'email' | 'phone' }) =>
    request<Inspection>(`/api/inspections/${id}/notify`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const moveTaskApi = {
  list: (params?: { status?: string; container_id?: number; source_inspection_id?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.container_id) query.set('container_id', String(params.container_id))
    if (params?.source_inspection_id) query.set('source_inspection_id', String(params.source_inspection_id))
    const qs = query.toString()
    return request<MoveTask[]>(`/api/move-tasks${qs ? `?${qs}` : ''}`)
  },
  create: (data: { container_id: number; from_slot: string; to_slot: string; reason?: string; source_inspection_id?: number }) =>
    request<MoveTask>('/api/move-tasks', { method: 'POST', body: JSON.stringify(data) }),
  execute: (id: number, data: { action: 'start' | 'complete'; remark?: string }) =>
    request<MoveTask>(`/api/move-tasks/${id}/execute`, { method: 'PUT', body: JSON.stringify(data) }),
  history: (id: number) => request<MoveTaskHistory>(`/api/move-tasks/${id}/history`),
}

export const problemApi = {
  list: (params?: { type?: string; status?: string; severity?: string; inspection_id?: number; container_id?: number }) => {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.status) query.set('status', params.status)
    if (params?.severity) query.set('severity', params.severity)
    if (params?.inspection_id) query.set('inspection_id', String(params.inspection_id))
    if (params?.container_id) query.set('container_id', String(params.container_id))
    const qs = query.toString()
    return request<ProblemOrder[]>(`/api/problems${qs ? `?${qs}` : ''}`)
  },
  stats: () => request<{ bySeverity: Record<string, number>; byType: Record<string, number>; openCount: number }>('/api/problems/stats'),
  get: (id: number) => request<ProblemDetail>(`/api/problems/${id}`),
  takeAction: (id: number, data: { action: 'reschedule' | 'supplement' | 'reject'; data: Record<string, unknown>; remark: string }) =>
    request<ProblemOrder>(`/api/problems/${id}/action`, { method: 'PUT', body: JSON.stringify(data) }),
  detect: () => request<ProblemOrder[]>('/api/problems/detect', { method: 'POST' }),
  resolve: (id: number) => request<ProblemOrder>(`/api/problems/${id}/resolve`, { method: 'PUT' }),
}

export const logApi = {
  list: (params?: { containerNo?: string; role?: string; action?: string; startTime?: string; endTime?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams()
    if (params?.containerNo) query.set('containerNo', params.containerNo)
    if (params?.role) query.set('role', params.role)
    if (params?.action) query.set('action', params.action)
    if (params?.startTime) query.set('startTime', params.startTime)
    if (params?.endTime) query.set('endTime', params.endTime)
    if (params?.page) query.set('page', String(params.page))
    if (params?.size) query.set('size', String(params.size))
    const qs = query.toString()
    return request<LogsListResponse>(`/api/logs${qs ? `?${qs}` : ''}`)
  },
}

export const dashboardApi = {
  get: (role: string) => request<DashboardData>(`/api/dashboard/${role}`),
}
