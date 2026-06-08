const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || res.statusText)
  }
  return res.json()
}

export interface Container {
  id: number
  container_no: string
  size: string
  type: string
  status: string
  yard_block: string | null
  yard_slot: string | null
  vessel: string | null
  voyage: string | null
  bill_of_lading: string | null
  created_at: string
  updated_at: string
}

export interface ContainerCreate {
  container_no: string
  size: string
  type: string
  status?: string
  yard_block?: string | null
  yard_slot?: string | null
  vessel?: string | null
  voyage?: string | null
  bill_of_lading?: string | null
}

export interface TimelineEvent {
  id: number
  entity_type: string
  entity_id: number
  event_type: string
  description: string | null
  operator: string | null
  created_at: string
}

export interface ExceptionRecord {
  id: number
  entity_type: string
  entity_id: number
  exception_type: string
  description: string | null
  status: string
  handler: string | null
  handled_at: string | null
  created_at: string
}

export interface Attachment {
  id: number
  entity_type: string
  entity_id: number
  file_name: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface GateRelease {
  id: number
  container_id: number
  release_type: string
  truck_company: string | null
  truck_plate: string | null
  driver_name: string | null
  driver_phone: string | null
  status: string
  notes: string | null
  operator: string | null
  created_at: string
  released_at: string | null
  container: Container | null
}

export interface GateReleaseDetail extends GateRelease {
  timeline_events: TimelineEvent[]
  exception_records: ExceptionRecord[]
  attachments: Attachment[]
}

export interface GateReleaseCreate {
  container_id: number
  release_type: string
  truck_company?: string | null
  truck_plate?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  notes?: string | null
  operator?: string | null
}

export interface GateReleaseAction {
  notes?: string | null
  operator?: string | null
}

export interface FleetAppointment {
  id: number
  gate_release_id: number | null
  container_id: number | null
  truck_company: string | null
  truck_plate: string | null
  driver_name: string | null
  driver_phone: string | null
  appointment_time: string | null
  appointment_date: string | null
  status: string
  notes: string | null
  operator: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  container: Container | null
  gate_release: GateRelease | null
}

export interface FleetAppointmentDetail extends FleetAppointment {
  timeline_events: TimelineEvent[]
  exception_records: ExceptionRecord[]
  attachments: Attachment[]
}

export interface FleetAppointmentCreate {
  gate_release_id?: number | null
  container_id?: number | null
  truck_company?: string | null
  truck_plate?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  appointment_time?: string | null
  appointment_date?: string | null
  notes?: string | null
  operator?: string | null
}

export interface FleetAppointmentAction {
  notes?: string | null
  operator?: string | null
}

export interface FleetAppointmentException {
  exception_type: string
  description?: string | null
  operator?: string | null
}

export interface ExceptionHandle {
  handler: string
  result?: string | null
}

export interface AttachmentCreate {
  file_name: string
  file_type?: string | null
  file_size?: number | null
  uploaded_by?: string | null
}

export interface GateReleaseListParams {
  status?: string
  release_type?: string
  date_from?: string
  date_to?: string
  container_no?: string
}

export interface FleetAppointmentListParams {
  status?: string
  appointment_date?: string
  truck_company?: string
}

export interface ContainerListParams {
  status?: string
  size?: string
  type?: string
  container_no?: string
}

export const api = {
  containers: {
    list: (params?: ContainerListParams) => {
      const search = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) search.set(k, v) })
      return request<Container[]>(`/containers/${search.toString() ? '?' + search : ''}`)
    },
    get: (id: number) => request<Container>(`/containers/${id}`),
    create: (data: ContainerCreate) => request<Container>('/containers/', { method: 'POST', body: JSON.stringify(data) }),
  },

  gateReleases: {
    list: (params?: GateReleaseListParams) => {
      const search = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) search.set(k, v) })
      return request<GateRelease[]>(`/gate-releases/${search.toString() ? '?' + search : ''}`)
    },
    get: (id: number) => request<GateReleaseDetail>(`/gate-releases/${id}`),
    create: (data: GateReleaseCreate) => request<GateRelease>('/gate-releases/', { method: 'POST', body: JSON.stringify(data) }),
    release: (id: number, data: GateReleaseAction) => request<GateRelease>(`/gate-releases/${id}/release`, { method: 'PUT', body: JSON.stringify(data) }),
    reject: (id: number, data: GateReleaseAction) => request<GateRelease>(`/gate-releases/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
    timeline: (id: number) => request<TimelineEvent[]>(`/gate-releases/${id}/timeline`),
    exceptions: (id: number) => request<ExceptionRecord[]>(`/gate-releases/${id}/exceptions`),
    addAttachment: (id: number, data: AttachmentCreate) => request<Attachment>(`/gate-releases/${id}/attachments`, { method: 'POST', body: JSON.stringify(data) }),
  },

  fleetAppointments: {
    list: (params?: FleetAppointmentListParams) => {
      const search = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) search.set(k, v) })
      return request<FleetAppointment[]>(`/fleet-appointments/${search.toString() ? '?' + search : ''}`)
    },
    get: (id: number) => request<FleetAppointmentDetail>(`/fleet-appointments/${id}`),
    create: (data: FleetAppointmentCreate) => request<FleetAppointment>('/fleet-appointments/', { method: 'POST', body: JSON.stringify(data) }),
    confirm: (id: number, data: FleetAppointmentAction) => request<FleetAppointment>(`/fleet-appointments/${id}/confirm`, { method: 'PUT', body: JSON.stringify(data) }),
    arrive: (id: number, data: FleetAppointmentAction) => request<FleetAppointment>(`/fleet-appointments/${id}/arrive`, { method: 'PUT', body: JSON.stringify(data) }),
    complete: (id: number, data: FleetAppointmentAction) => request<FleetAppointment>(`/fleet-appointments/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),
    cancel: (id: number, data: FleetAppointmentAction) => request<FleetAppointment>(`/fleet-appointments/${id}/cancel`, { method: 'PUT', body: JSON.stringify(data) }),
    exception: (id: number, data: FleetAppointmentException) => request<FleetAppointment>(`/fleet-appointments/${id}/exception`, { method: 'PUT', body: JSON.stringify(data) }),
    timeline: (id: number) => request<TimelineEvent[]>(`/fleet-appointments/${id}/timeline`),
    exceptions: (id: number) => request<ExceptionRecord[]>(`/fleet-appointments/${id}/exceptions`),
    addAttachment: (id: number, data: AttachmentCreate) => request<Attachment>(`/fleet-appointments/${id}/attachments`, { method: 'POST', body: JSON.stringify(data) }),
  },

  exceptions: {
    handle: (id: number, data: ExceptionHandle) => request<ExceptionRecord>(`/exceptions/${id}/handle`, { method: 'PUT', body: JSON.stringify(data) }),
  },
}
