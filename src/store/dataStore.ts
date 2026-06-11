import { create } from 'zustand'

interface DataState {
  schedules: any[]
  attendance: any[]
  reviews: any[]
  exceptions: any[]
  exceptionStats: Record<string, number>
  logs: any[]
  loading: boolean
  fetchSchedules: (filters?: Record<string, unknown>) => Promise<void>
  fetchAttendance: (filters?: Record<string, unknown>) => Promise<void>
  fetchReviews: (filters?: Record<string, unknown>) => Promise<void>
  fetchExceptions: (filters?: Record<string, unknown>) => Promise<void>
  fetchExceptionStats: () => Promise<void>
  fetchLogs: (filters?: Record<string, unknown>) => Promise<void>
  confirmAttendance: (id: number, operatorId: number) => Promise<void>
  markException: (id: number, operatorId: number, exceptionType: string, note: string) => Promise<void>
  submitMaterial: (id: number, operatorId: number) => Promise<void>
  escalateTimeout: (id: number, supervisorId: number) => Promise<void>
  resubmitAttendance: (id: number, operatorId: number) => Promise<void>
  approveReview: (id: number, reviewerId: number, reviewerRole: string) => Promise<void>
  rejectReview: (id: number, reviewerId: number, reviewerRole: string, reason: string) => Promise<void>
  submitSchedule: (id: number, operatorId: number) => Promise<void>
  resetData: () => Promise<void>
}

const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  return json
}

const withParams = (path: string, filters?: Record<string, unknown>) => {
  if (!filters || Object.keys(filters).length === 0) return path
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export const useDataStore = create<DataState>((set, get) => ({
  schedules: [],
  attendance: [],
  reviews: [],
  exceptions: [],
  exceptionStats: {},
  logs: [],
  loading: false,

  fetchSchedules: async (filters?) => {
    set({ loading: true })
    const json = await api(withParams('/schedules', filters))
    set({ schedules: json.data ?? [], loading: false })
  },

  fetchAttendance: async (filters?) => {
    set({ loading: true })
    const json = await api(withParams('/attendance', filters))
    set({ attendance: json.data ?? [], loading: false })
  },

  fetchReviews: async (filters?) => {
    set({ loading: true })
    const json = await api(withParams('/reviews', filters))
    set({ reviews: json.data ?? [], loading: false })
  },

  fetchExceptions: async (filters?) => {
    set({ loading: true })
    const json = await api(withParams('/exceptions', filters))
    set({ exceptions: json.data ?? [], loading: false })
  },

  fetchExceptionStats: async () => {
    const json = await api('/exceptions/stats')
    set({ exceptionStats: json.data ?? {} })
  },

  fetchLogs: async (filters?) => {
    set({ loading: true })
    const json = await api(withParams('/logs', filters))
    set({ logs: json.data ?? [], loading: false })
  },

  confirmAttendance: async (id, operatorId) => {
    await api(`/attendance/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ operatorId }),
    })
  },

  markException: async (id, operatorId, exceptionType, note) => {
    await api(`/attendance/${id}/exception`, {
      method: 'POST',
      body: JSON.stringify({ operatorId, exceptionType, note }),
    })
  },

  submitMaterial: async (id, operatorId) => {
    await api(`/attendance/${id}/submit-material`, {
      method: 'POST',
      body: JSON.stringify({ operatorId }),
    })
  },

  escalateTimeout: async (id, supervisorId) => {
    await api(`/attendance/${id}/escalate-timeout`, {
      method: 'POST',
      body: JSON.stringify({ supervisorId }),
    })
  },

  approveReview: async (id, reviewerId, reviewerRole) => {
    await api(`/reviews/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewerId, reviewerRole }),
    })
  },

  rejectReview: async (id, reviewerId, reviewerRole, reason) => {
    await api(`/reviews/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewerId, reviewerRole, reason }),
    })
  },

  submitSchedule: async (id, operatorId) => {
    await api(`/schedules/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ operatorId }),
    })
  },

  resubmitAttendance: async (id, operatorId) => {
    await api(`/attendance/${id}/resubmit`, {
      method: 'POST',
      body: JSON.stringify({ operatorId }),
    })
  },

  resetData: async () => {
    await api('/reset', { method: 'POST' })
  },
}))
