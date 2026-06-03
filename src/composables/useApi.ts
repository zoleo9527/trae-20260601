import type { Event, Reconciliation, Feedback, TimelineEntry, HandoverItem } from '@/types'

const API_BASE = '/api'

async function request<T = unknown>(url: string, options: RequestInit = {}): Promise<{ success: boolean; data: T; error?: string }> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return response.json() as Promise<{ success: boolean; data: T; error?: string }>
}

export function useEvents() {
  const getEvents = (status?: string) =>
    request<Event[]>(`/events${status ? `?status=${status}` : ''}`)

  const getEvent = (id: string) =>
    request<Event>(`/events/${id}`)

  const createEvent = (data: {
    name: string
    clientName: string
    eventDate: string
    venue: string
    tables: number
    menuPrice: number
    totalAmount: number
    createdBy: string
  }) =>
    request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })

  return { getEvents, getEvent, createEvent }
}

export function useReconciliations() {
  const getReconciliations = (status?: string) =>
    request<Reconciliation[]>(`/reconciliations${status ? `?status=${status}` : ''}`)

  const getReconciliation = (id: string) =>
    request<Reconciliation>(`/reconciliations/${id}`)

  const createReconciliation = (data: { eventId: string; createdBy: string }) =>
    request<Reconciliation>('/reconciliations', {
      method: 'POST',
      body: JSON.stringify(data),
    })

  const confirmItem = (reconciliationId: string, itemId: string, data: { role: string; name: string }) =>
    request(`/reconciliations/${reconciliationId}/items/${itemId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

  const markDifference = (reconciliationId: string, itemId: string, data: {
    actualAmount: number
    differenceNote: string
    role: string
    name: string
  }) =>
    request(`/reconciliations/${reconciliationId}/items/${itemId}/difference`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

  const batchConfirm = (data: {
    itemIds: string[]
    reconciliationId: string
    role: string
    name: string
  }) =>
    request<{ confirmedCount: number }>('/reconciliations/batch-confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    })

  return {
    getReconciliations,
    getReconciliation,
    createReconciliation,
    confirmItem,
    markDifference,
    batchConfirm,
  }
}

export function useFeedbacks() {
  const getFeedbacks = (status?: string, search?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    return request<Feedback[]>(`/feedbacks${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const getFeedback = (id: string) =>
    request<Feedback>(`/feedbacks/${id}`)

  const updateSection = (feedbackId: string, role: string, data: {
    content: string
    rating: number
    filledBy: string
  }) =>
    request(`/feedbacks/${feedbackId}/sections/${role}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

  return { getFeedbacks, getFeedback, updateSection }
}

export function useTimeline() {
  const getTimeline = (eventId: string) =>
    request<TimelineEntry[]>(`/events/${eventId}/timeline`)

  return { getTimeline }
}

export function useHandover() {
  const getHandover = () =>
    request<HandoverItem[]>('/handover')

  return { getHandover }
}

export function useDashboard() {
  const getDashboard = () =>
    request('/dashboard')

  return { getDashboard }
}
