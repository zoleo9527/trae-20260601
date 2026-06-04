const BASE_URL = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error || '请求失败')
  }

  return data.data
}

import type {
  User,
  Appointment,
  AppointmentDetail,
  Exception,
  ConsultationNote,
  VisitRecord,
  PlanConfirmationStep,
  Plan,
} from '@/types'

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<User>('/auth/me'),
  },

  appointments: {
    list: () => request<Appointment[]>('/appointments'),
    detail: (id: string) => request<AppointmentDetail>(`/appointments/${id}`),
    updateStatus: (id: string, status: string) =>
      request<Appointment>(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  exceptions: {
    list: () => request<Exception[]>('/exceptions/open'),
    getByAppointment: (appointmentId: string) =>
      request<Exception[]>(`/exceptions/appointment/${appointmentId}`),
    update: (id: string, status: string, resolveNote?: string) =>
      request<Exception>(`/exceptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolveNote }),
      }),
  },

  notes: {
    list: (appointmentId: string) =>
      request<ConsultationNote[]>(`/notes/appointment/${appointmentId}`),
    create: (appointmentId: string, content: string) =>
      request<ConsultationNote>('/notes', {
        method: 'POST',
        body: JSON.stringify({ appointmentId, content }),
      }),
  },

  visits: {
    list: (appointmentId: string) =>
      request<VisitRecord[]>(`/visits/appointment/${appointmentId}`),
    create: (appointmentId: string, visitDate: string, content: string, satisfaction: number, hasComplaint: boolean) =>
      request<VisitRecord>('/visits', {
        method: 'POST',
        body: JSON.stringify({ appointmentId, visitDate, content, satisfaction, hasComplaint }),
      }),
  },

  plans: {
    list: (appointmentId: string) =>
      request<Plan[]>(`/plans/appointment/${appointmentId}`),
    confirm: (id: string) =>
      request<Plan>(`/plans/${id}/confirm`, { method: 'PATCH' }),
    confirmStep: (stepId: string, note?: string) =>
      request<{ steps: PlanConfirmationStep[]; allCompleted: boolean }>(`/plans/confirmation-step/${stepId}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
  },
}
