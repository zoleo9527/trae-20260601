import type { CareRecord, Communication, Followup, Order, Patient, Role } from '@/types'
import { create } from 'zustand'

interface AppState {
  role: Role
  setRole: (role: Role) => void
  patients: Patient[]
  fetchPatients: () => Promise<void>
  careRecords: CareRecord[]
  fetchCareRecords: (patientId: number) => Promise<void>
  todayTasks: CareRecord[]
  fetchTodayTasks: () => Promise<void>
  orders: Order[]
  fetchOrders: (patientId: number) => Promise<void>
  followups: Followup[]
  fetchFollowups: (status?: string) => Promise<void>
  communications: Communication[]
  fetchCommunications: (patientId: number) => Promise<void>
  updateCareRecord: (id: number, data: Partial<CareRecord>) => Promise<void>
  updateFollowup: (id: number, data: Partial<Followup>) => Promise<void>
  addCommunication: (patientId: number, data: Omit<Communication, 'id'>) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  role: 'doctor',
  setRole: (role) => set({ role }),

  patients: [],
  fetchPatients: async () => {
    const res = await fetch('/api/patients')
    const json = await res.json()
    if (json.success) set({ patients: json.data })
  },

  careRecords: [],
  fetchCareRecords: async (patientId) => {
    const res = await fetch(`/api/care-records/patient/${patientId}`)
    const json = await res.json()
    if (json.success) set({ careRecords: json.data })
  },

  todayTasks: [],
  fetchTodayTasks: async () => {
    const res = await fetch('/api/care-records/today')
    const json = await res.json()
    if (json.success) set({ todayTasks: json.data })
  },

  orders: [],
  fetchOrders: async (patientId) => {
    const res = await fetch(`/api/orders/patient/${patientId}`)
    const json = await res.json()
    if (json.success) set({ orders: json.data })
  },

  followups: [],
  fetchFollowups: async (status) => {
    const url = status ? `/api/followups?status=${status}` : '/api/followups'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) set({ followups: json.data })
  },

  communications: [],
  fetchCommunications: async (patientId) => {
    const res = await fetch(`/api/communications/patient/${patientId}`)
    const json = await res.json()
    if (json.success) set({ communications: json.data })
  },

  updateCareRecord: async (id, data) => {
    await fetch(`/api/care-records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  updateFollowup: async (id, data) => {
    await fetch(`/api/followups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  addCommunication: async (patientId, data) => {
    await fetch(`/api/communications/patient/${patientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },
}))
