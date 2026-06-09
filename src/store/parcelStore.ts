import { create } from 'zustand';

const ROLE_MAP: Record<string, { id: number; name: string; role: string }> = {
  customer_service: { id: 1, name: '张客服', role: 'customer_service' },
  courier: { id: 3, name: '王派件员', role: 'courier' },
  station_manager: { id: 6, name: '陈站长', role: 'station_manager' },
}

interface ParcelState {
  currentRole: string
  currentStaffId: number
  currentStaffName: string
  parcels: any[]
  totalParcels: number
  auditLogs: any[]
  problems: any[]
  staff: any[]
  stations: any[]
  couriers: any[]
  stationManagers: any[]
  loading: boolean

  setCurrentRole: (roleKey: string) => void
  fetchParcels: (filters?: Record<string, any>) => Promise<void>
  scanParcel: (trackingNo: string, note?: string) => Promise<void>
  batchScan: (items: Array<{ trackingNo: string }>, note?: string) => Promise<void>
  scanAndDispatch: (items: Array<{ trackingNo: string }>, assigneeId: number, assigneeType: string, note?: string) => Promise<void>
  dispatchParcels: (parcelIds: number[], assigneeId: number, assigneeType: string, note?: string) => Promise<void>
  startDelivery: (parcelId: number, note?: string) => Promise<void>
  signParcels: (parcelIds: number[], note?: string) => Promise<void>
  reportProblem: (parcelId: number, problemType: string, note?: string) => Promise<void>
  resolveProblem: (parcelId: number, resolution: string, note?: string) => Promise<void>
  fetchAuditLog: (parcelId: number) => Promise<void>
  fetchProblems: () => Promise<void>
  fetchStaff: () => Promise<void>
  fetchCouriers: () => Promise<void>
  fetchStationManagers: () => Promise<void>
  fetchStations: () => Promise<void>
}

export const useParcelStore = create<ParcelState>((set, get) => ({
  currentRole: 'customer_service',
  currentStaffId: 1,
  currentStaffName: '张客服',
  parcels: [],
  totalParcels: 0,
  auditLogs: [],
  problems: [],
  staff: [],
  stations: [],
  couriers: [],
  stationManagers: [],
  loading: false,

  setCurrentRole: (roleKey: string) => {
    const info = ROLE_MAP[roleKey]
    if (info) {
      set({ currentRole: info.role, currentStaffId: info.id, currentStaffName: info.name })
    }
  },

  fetchParcels: async (filters?: Record<string, any>) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
        })
      }
      const res = await fetch(`/api/parcels?${params}`)
      const json = await res.json()
      if (json.success) {
        set({ parcels: json.data.data, totalParcels: json.data.total })
      }
    } finally {
      set({ loading: false })
    }
  },

  scanParcel: async (trackingNo: string, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNo, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  batchScan: async (items: Array<{ trackingNo: string }>, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/scan/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  scanAndDispatch: async (items: Array<{ trackingNo: string }>, assigneeId: number, assigneeType: string, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/scan-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, assigneeId, assigneeType, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  dispatchParcels: async (parcelIds: number[], assigneeId: number, assigneeType: string, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelIds, assigneeId, assigneeType, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  startDelivery: async (parcelId: number, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  signParcels: async (parcelIds: number[], note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelIds, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  reportProblem: async (parcelId: number, problemType: string, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch('/api/parcels/problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, problemType, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchParcels()
  },

  resolveProblem: async (parcelId: number, resolution: string, note?: string) => {
    const { currentStaffId } = get()
    const res = await fetch(`/api/parcels/problem/${parcelId}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, operatorId: currentStaffId, note }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    await get().fetchProblems()
    await get().fetchParcels()
  },

  fetchAuditLog: async (parcelId: number) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/parcels/${parcelId}/audit-log`)
      const json = await res.json()
      if (json.success) {
        set({ auditLogs: json.data.logs })
      }
    } finally {
      set({ loading: false })
    }
  },

  fetchProblems: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/parcels/problems')
      const json = await res.json()
      if (json.success) {
        set({ problems: json.data })
      }
    } finally {
      set({ loading: false })
    }
  },

  fetchStaff: async () => {
    const res = await fetch('/api/staff')
    const json = await res.json()
    if (json.success) set({ staff: json.data })
  },

  fetchCouriers: async () => {
    const res = await fetch('/api/staff/couriers')
    const json = await res.json()
    if (json.success) set({ couriers: json.data })
  },

  fetchStationManagers: async () => {
    const res = await fetch('/api/staff/station-managers')
    const json = await res.json()
    if (json.success) set({ stationManagers: json.data })
  },

  fetchStations: async () => {
    const res = await fetch('/api/stations')
    const json = await res.json()
    if (json.success) set({ stations: json.data })
  },
}))
