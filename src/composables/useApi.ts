import { useAuthStore } from '@/stores/auth'

function getHeaders(): Record<string, string> {
  const auth = useAuthStore()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (auth.role) headers['x-user-role'] = auth.role
  if (auth.name) headers['x-user-name'] = auth.name
  return headers
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '请求失败' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useApi() {
  function getTransfers(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return request<any>(`/api/transfers${query}`)
  }

  function createTransfer(data: any) {
    return request<any>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  function updateTransferStatus(id: number, action: string, remark?: string) {
    return request<any>(`/api/transfers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action, remark }),
    })
  }

  function getTransferDetail(id: number) {
    return request<any>(`/api/transfers/${id}`)
  }

  function getAssessments(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return request<any>(`/api/assessments${query}`)
  }

  function createAssessment(transferId: number, data: any) {
    return request<any>(`/api/transfers/${transferId}/assessments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  function approveAssessment(id: number, approved: boolean, remark?: string) {
    return request<any>(`/api/assessments/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, remark }),
    })
  }

  function getAssessmentDetail(id: number) {
    return request<any>(`/api/assessments/${id}`)
  }

  function getLogs(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return request<any>(`/api/logs${query}`)
  }

  function getStats(role: string) {
    return request<any>(`/api/stats?role=${role}`)
  }

  return {
    getTransfers,
    createTransfer,
    updateTransferStatus,
    getTransferDetail,
    getAssessments,
    createAssessment,
    approveAssessment,
    getAssessmentDetail,
    getLogs,
    getStats,
  }
}
