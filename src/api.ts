import type { Detention, CreateDetentionReq, SubmitSuppReq, SubmitReviewReq, SubmitResultReq } from './types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`)
  }
  const json = await res.json()
  if (json.success) {
    return json.data as T
  }
  throw new Error(json.message || '请求失败')
}

export function fetchDetentions(status?: string): Promise<Detention[]> {
  const params = status ? `?status=${status}` : ''
  return request<Detention[]>(`/api/detentions${params}`)
}

export function fetchDetention(id: string): Promise<Detention> {
  return request<Detention>(`/api/detentions/${id}`)
}

export function createDetention(data: CreateDetentionReq): Promise<Detention> {
  return request<Detention>('/api/detentions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function submitSupplementary(id: string, data: SubmitSuppReq): Promise<Detention> {
  return request<Detention>(`/api/detentions/${id}/supplementary`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function submitReview(id: string, data: SubmitReviewReq): Promise<Detention> {
  return request<Detention>(`/api/detentions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function submitResult(id: string, data: SubmitResultReq): Promise<Detention> {
  return request<Detention>(`/api/detentions/${id}/result`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
