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

interface FetchDetentionsParams {
  status?: string
  keyword?: string
  reason?: string
}

export function fetchDetentions(params?: FetchDetentionsParams): Promise<Detention[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  if (params?.reason) searchParams.set('reason', params.reason)
  const qs = searchParams.toString()
  return request<Detention[]>(`/api/detentions${qs ? `?${qs}` : ''}`)
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
