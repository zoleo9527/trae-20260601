import type {
  DashboardData,
  Dock,
  UnloadRecord,
  OperationLog,
  CreateRecordRequest,
  UpdateStatusRequest,
  DiscrepancyRequest,
  AssignDockRequest,
  BatchAssignDockRequest,
  BatchCheckInRequest,
  CompleteNoDiscrepancyRequest,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => request<DashboardData>('/dashboard'),

  getDocks: () => request<Dock[]>('/docks'),
  assignDock: (dockId: string, data: AssignDockRequest) =>
    request<UnloadRecord>(`/docks/${dockId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getRecords: (filters?: { status?: string; plateNumber?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.plateNumber) params.set('plateNumber', filters.plateNumber);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<UnloadRecord[]>(`/records${qs}`);
  },

  getRecord: (id: string) => request<UnloadRecord>(`/records/${id}`),

  createRecord: (data: CreateRecordRequest) =>
    request<UnloadRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    request<UnloadRecord>(`/records/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  registerDiscrepancy: (id: string, data: DiscrepancyRequest) =>
    request<UnloadRecord>(`/records/${id}/discrepancy`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getLogs: (recordId: string) =>
    request<OperationLog[]>(`/records/${recordId}/logs`),

  batchAssignDock: (data: BatchAssignDockRequest) =>
    request<{ success: string[]; failed: string[] }>('/records/batch/assign-dock', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  batchCheckIn: (data: BatchCheckInRequest) =>
    request<{ success: string[]; failed: string[] }>('/records/batch/check-in', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  completeNoDiscrepancy: (id: string, data: CompleteNoDiscrepancyRequest) =>
    request<UnloadRecord>(`/records/${id}/complete-no-discrepancy`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
