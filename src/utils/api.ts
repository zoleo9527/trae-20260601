import type { AppointmentRecord, ActionLog, RoleType, RecordStatus } from '@/types'

const API_BASE = '/api'

export async function fetchRecords(role?: RoleType, status?: RecordStatus): Promise<AppointmentRecord[]> {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (status) params.set('status', status)
  const res = await fetch(`${API_BASE}/records?${params.toString()}`)
  return res.json()
}

export async function fetchRecord(id: string): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/records/${id}`)
  return res.json()
}

export async function fetchLogs(id: string): Promise<ActionLog[]> {
  const res = await fetch(`${API_BASE}/records/${id}/logs`)
  return res.json()
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: '请求失败，请稍后重试' }))
    throw new Error(data.error || `请求失败 (${res.status})`)
  }
  return res.json()
}

export async function receiveRecord(id: string, receptionNotes: string, operatorId: string): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/records/${id}/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receptionNotes, operatorId }),
  })
  return handleResponse<AppointmentRecord>(res)
}

export async function inspectRecord(id: string, inspectionResult: string, operatorId: string): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/records/${id}/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionResult, operatorId }),
  })
  return handleResponse<AppointmentRecord>(res)
}

export async function reviewRecord(id: string, reviewResult: string, returnReason: string, operatorId: string): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/records/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewResult, returnReason, operatorId }),
  })
  return handleResponse<AppointmentRecord>(res)
}

export async function supplementRecord(id: string, supplementaryNotes: string, operatorId: string): Promise<AppointmentRecord> {
  const res = await fetch(`${API_BASE}/records/${id}/supplement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplementaryNotes, operatorId }),
  })
  return handleResponse<AppointmentRecord>(res)
}

export async function batchReview(ids: string[], reviewResult: string, returnReason: string, operatorId: string): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/records/batch-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, reviewResult, returnReason, operatorId }),
  })
  return handleResponse<{ updated: number }>(res)
}

export async function resetData(): Promise<{ reset: boolean }> {
  const res = await fetch(`${API_BASE}/records/reset`, { method: 'POST' })
  return res.json()
}

export async function createNormalDemo(): Promise<{ id: string; plateNumber: string; message: string }> {
  const res = await fetch(`${API_BASE}/records/demo/normal`, { method: 'POST' })
  return res.json()
}

export async function createExceptionDemo(): Promise<{ id: string; plateNumber: string; message: string }> {
  const res = await fetch(`${API_BASE}/records/demo/exception`, { method: 'POST' })
  return res.json()
}

export async function getDemoStatus(): Promise<AppointmentRecord[]> {
  const res = await fetch(`${API_BASE}/records/demo/status`)
  return res.json()
}
