import { create } from 'zustand'

export interface Booking {
  id: number
  member_name: string
  member_phone: string
  course_id: number
  course_name: string
  belayer_id: number | null
  belayer_name: string | null
  booking_date: string
  time_slot: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  idempotency_key: string
  created_at: string
  updated_at: string
}

export interface BookingSummary {
  course_name: string
  booking_date: string
  time_slot: string
  status: string
}

export interface RelatedAnomaly {
  anomaly_id: number
  description: string
  severity: string
}

export interface EquipmentIssuance {
  id: number
  booking_id: number | null
  member_name: string
  equipment_type: string
  equipment_id: string
  condition_out: string
  condition_in: string | null
  issued_by: string
  issued_at: string
  returned_at: string | null
  returned_by: string | null
  idempotency_key: string
  booking_summary: BookingSummary | null
  related_anomalies: RelatedAnomaly[]
}

export interface Anomaly {
  id: number
  booking_id: number | null
  issuance_id: number | null
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'resolved'
  reported_by: string
  resolved_by: string | null
  resolution: string | null
  created_at: string
  resolved_at: string | null
}

export interface HandoverSnapshot {
  id: number
  pending_bookings: number
  unreturned_equipment: number
  open_anomalies: number
  operator_out: string
  operator_in: string
  notes: string
  created_at: string
}

export interface SnapshotBooking {
  id: number
  snapshot_id: number
  booking_id: number
  member_name: string
  course_name: string
  booking_date: string
  time_slot: string
  status: string
}

export interface SnapshotEquipment {
  id: number
  snapshot_id: number
  issuance_id: number
  member_name: string
  equipment_type: string
  equipment_id: string
  condition_out: string
  issued_by: string
  issued_at: string
}

export interface SnapshotAnomaly {
  id: number
  snapshot_id: number
  anomaly_id: number
  description: string
  severity: string
  reported_by: string
  created_at: string
}

export interface SnapshotDetails {
  snapshot: HandoverSnapshot
  bookings: SnapshotBooking[]
  equipment: SnapshotEquipment[]
  anomalies: SnapshotAnomaly[]
}

export interface ShiftTodo {
  id: number
  content: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'done'
  created_by: string
  completed_by: string | null
  completed_at: string | null
  created_at: string
}

export interface Course {
  id: number
  name: string
  level: string
  duration_min: number
}

export interface Belayer {
  id: number
  name: string
  phone: string
  status: string
}

export interface EquipmentType {
  id: number
  name: string
}

interface DashboardData {
  pending_bookings: number
  unreturned_equipment: number
  open_anomalies: number
  open_anomaly_list: Anomaly[]
  pending_todo_list: ShiftTodo[]
  recent_completed: (Booking | EquipmentIssuance)[]
}

interface AppState {
  bookings: Booking[]
  equipmentIssuances: EquipmentIssuance[]
  anomalies: Anomaly[]
  shiftTodos: ShiftTodo[]
  handoverSnapshots: HandoverSnapshot[]
  snapshotDetails: SnapshotDetails | null
  courses: Course[]
  belayers: Belayer[]
  equipmentTypes: EquipmentType[]
  dashboard: DashboardData | null

  loadingBookings: boolean
  loadingEquipment: boolean
  loadingAnomalies: boolean
  loadingHandover: boolean
  loadingDashboard: boolean
  loadingSnapshotDetails: boolean

  fetchBookings: (params?: Record<string, string>) => Promise<void>
  createBooking: (data: Partial<Booking> & { idempotency_key: string }) => Promise<void>
  updateBookingStatus: (id: number, status: string, operator: string) => Promise<void>

  fetchEquipmentIssuances: (params?: Record<string, string>) => Promise<void>
  createEquipmentIssuance: (data: Partial<EquipmentIssuance> & { idempotency_key: string }) => Promise<void>
  returnEquipment: (id: number, data: { condition_in: string; returned_by: string }) => Promise<void>

  fetchAnomalies: (params?: Record<string, string>) => Promise<void>
  createAnomaly: (data: Partial<Anomaly>) => Promise<void>
  resolveAnomaly: (id: number, data: { resolution: string; resolved_by: string }) => Promise<void>

  fetchShiftTodos: () => Promise<void>
  addShiftTodo: (data: Partial<ShiftTodo>) => Promise<void>
  completeShiftTodo: (id: number, completed_by: string) => Promise<void>

  fetchHandoverSnapshots: () => Promise<void>
  createHandoverSnapshot: (data: { operator_out: string; operator_in: string; notes: string }) => Promise<void>
  fetchSnapshotDetails: (id: number) => Promise<void>
  clearSnapshotDetails: () => void

  fetchDashboard: () => Promise<void>
  fetchCourses: () => Promise<void>
  fetchBelayers: () => Promise<void>
  fetchEquipmentTypes: () => Promise<void>
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `请求失败: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

export const useStore = create<AppState>((set, get) => ({
  bookings: [],
  equipmentIssuances: [],
  anomalies: [],
  shiftTodos: [],
  handoverSnapshots: [],
  snapshotDetails: null,
  courses: [],
  belayers: [],
  equipmentTypes: [],
  dashboard: null,

  loadingBookings: false,
  loadingEquipment: false,
  loadingAnomalies: false,
  loadingHandover: false,
  loadingDashboard: false,
  loadingSnapshotDetails: false,

  fetchBookings: async (params) => {
    set({ loadingBookings: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<Booking[]>(`/api/bookings${query}`)
      set({ bookings: data, loadingBookings: false })
    } catch {
      set({ loadingBookings: false })
    }
  },

  createBooking: async (data) => {
    const created = await apiFetch<Booking>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': data.idempotency_key },
      body: JSON.stringify(data),
    })
    set({ bookings: [...get().bookings, created] })
  },

  updateBookingStatus: async (id, status, operator) => {
    const updated = await apiFetch<Booking>(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, operator }),
    })
    set({
      bookings: get().bookings.map((b) =>
        b.id === id ? updated : b
      ),
    })
  },

  fetchEquipmentIssuances: async (params) => {
    set({ loadingEquipment: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<EquipmentIssuance[]>(`/api/equipment${query}`)
      set({ equipmentIssuances: data, loadingEquipment: false })
    } catch {
      set({ loadingEquipment: false })
    }
  },

  createEquipmentIssuance: async (data) => {
    const created = await apiFetch<EquipmentIssuance>('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': data.idempotency_key },
      body: JSON.stringify(data),
    })
    set({ equipmentIssuances: [...get().equipmentIssuances, created] })
  },

  returnEquipment: async (id, data) => {
    const updated = await apiFetch<EquipmentIssuance>(`/api/equipment/${id}/return`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    set({
      equipmentIssuances: get().equipmentIssuances.map((e) =>
        e.id === id ? updated : e
      ),
    })
  },

  fetchAnomalies: async (params) => {
    set({ loadingAnomalies: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<Anomaly[]>(`/api/anomalies${query}`)
      set({ anomalies: data, loadingAnomalies: false })
    } catch {
      set({ loadingAnomalies: false })
    }
  },

  createAnomaly: async (data) => {
    const created = await apiFetch<Anomaly>('/api/anomalies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set({ anomalies: [...get().anomalies, created] })
  },

  resolveAnomaly: async (id, data) => {
    const updated = await apiFetch<Anomaly>(`/api/anomalies/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    set({
      anomalies: get().anomalies.map((a) =>
        a.id === id ? updated : a
      ),
    })
  },

  fetchShiftTodos: async () => {
    try {
      const data = await apiFetch<ShiftTodo[]>('/api/handover/todos')
      set({ shiftTodos: data })
    } catch {}
  },

  addShiftTodo: async (data) => {
    const created = await apiFetch<ShiftTodo>('/api/handover/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set({ shiftTodos: [...get().shiftTodos, created] })
  },

  completeShiftTodo: async (id, completed_by) => {
    const updated = await apiFetch<ShiftTodo>(`/api/handover/todos/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed_by }),
    })
    set({
      shiftTodos: get().shiftTodos.map((t) =>
        t.id === id ? updated : t
      ),
    })
  },

  fetchHandoverSnapshots: async () => {
    set({ loadingHandover: true })
    try {
      const data = await apiFetch<HandoverSnapshot[]>('/api/handover/history')
      set({ handoverSnapshots: data, loadingHandover: false })
    } catch {
      set({ loadingHandover: false })
    }
  },

  createHandoverSnapshot: async (data) => {
    const created = await apiFetch<HandoverSnapshot>('/api/handover/snapshot', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    set({ handoverSnapshots: [...get().handoverSnapshots, created] })
  },

  fetchSnapshotDetails: async (id) => {
    set({ loadingSnapshotDetails: true })
    try {
      const data = await apiFetch<SnapshotDetails>(`/api/handover/snapshots/${id}/details`)
      set({ snapshotDetails: data, loadingSnapshotDetails: false })
    } catch {
      set({ loadingSnapshotDetails: false })
    }
  },

  clearSnapshotDetails: () => {
    set({ snapshotDetails: null })
  },

  fetchDashboard: async () => {
    set({ loadingDashboard: true })
    try {
      const data = await apiFetch<DashboardData>('/api/dashboard')
      set({ dashboard: data, loadingDashboard: false })
    } catch {
      set({ loadingDashboard: false })
    }
  },

  fetchCourses: async () => {
    try {
      const data = await apiFetch<Course[]>('/api/base/courses')
      set({ courses: data })
    } catch {}
  },

  fetchBelayers: async () => {
    try {
      const data = await apiFetch<Belayer[]>('/api/base/belayers')
      set({ belayers: data })
    } catch {}
  },

  fetchEquipmentTypes: async () => {
    try {
      const data = await apiFetch<string[]>('/api/base/equipment-types')
      set({ equipmentTypes: data.map((t: any) => ({ id: 0, name: t })) })
    } catch {}
  },
}))
