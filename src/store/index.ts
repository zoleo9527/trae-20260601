import { create } from 'zustand'

interface User {
  id: number
  username: string
  role: string
  name: string
}

interface Room {
  id: number
  room_number: string
  floor: number
  type: string
  status: string
  updated_at: string
  timeline?: TimelineEvent[]
}

interface TimelineEvent {
  id: number
  room_id: number
  operator_name: string
  event_type: string
  description: string
  created_at: string
}

interface Inspection {
  id: number
  room_id: number
  room_number: string
  inspector_id: number
  inspector_name: string
  status: string
  result?: string
  scheduled_at: string
  completed_at?: string
  notes?: string
}

interface Requisition {
  id: number
  requester_id: number
  requester_name: string
  items: unknown
  status: string
  created_at: string
  approved_at?: string
}

interface LinenReturn {
  id: number
  operator_id: number
  operator_name: string
  items: unknown
  status: string
  created_at: string
}

interface Loss {
  id: number
  reporter_id: number
  reporter_name: string
  items: unknown
  reason: string
  created_at: string
}

interface MaintenanceOrder {
  id: number
  room_id: number
  room_number: string
  category: string
  description: string
  status: string
  reporter_id: number
  reporter_name: string
  assigned_to?: number
  assigned_name?: string
  created_at: string
  completed_at?: string
}

interface Leftover {
  id: number
  room_id: number
  room_number: string
  item_name: string
  description: string
  location: string
  status: string
  reporter_id: number
  reporter_name: string
  created_at: string
  claimed_at?: string
}

interface WorkstationRequisition {
  id: string
  room_id: string
  room_number: string
  floor: number
  operator_id: string
  operator_name: string
  requisition_time: string
  status: string
  notes: string | null
  items: { id: string; category: string; quantity: number }[]
  returns: {
    id: string
    operator_id: string
    operator_name: string
    return_time: string
    verified_by: string | null
    verified_at: string | null
    notes: string | null
    items: { id: string; category: string; quantity: number }[]
  }[]
  losses: {
    id: string
    category: string
    quantity: number
    loss_type: string
    description: string | null
    status: string
    operator_name: string
    confirmer_name: string | null
    confirmed_by: string | null
    confirmed_at: string | null
    maintenance_order_id: string | null
    maintenance_status: string | null
    maintenance_fault_type: string | null
    engineer_name: string | null
    loss_date: string
  }[]
  statusLogs: {
    id: string
    target_type: string
    target_id: string
    old_status: string | null
    new_status: string
    operator_name: string
    note: string | null
    created_at: string
  }[]
}

interface WorkstationStandaloneLoss {
  id: string
  room_id: string
  room_number: string
  floor: number
  operator_id: string
  operator_name: string
  requisition_id: string | null
  category: string
  quantity: number
  loss_type: string
  description: string | null
  status: string
  confirmer_name: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  maintenance_order_id: string | null
  maintenance_status: string | null
  maintenance_fault_type: string | null
  engineer_name: string | null
  loss_date: string
}

interface WorkstationData {
  requisitions: WorkstationRequisition[]
  standaloneLosses: WorkstationStandaloneLoss[]
  summary: {
    pending: number
    fulfilled: number
    returned: number
    unconfirmedLoss: number
  }
}

interface LossRecapBucket {
  total: number
  registered: number
  confirmed: number
  dispatched: number
  replaced: number
}

interface LossRecapData {
  byCategory: Record<string, LossRecapBucket>
  byType: Record<string, LossRecapBucket>
  byOperator: Record<string, LossRecapBucket>
}

interface LossRecapFilter {
  dimension: 'category' | 'lossType' | 'operatorId' | null
  value: string | null
  label: string | null
}

interface Stats {
  [key: string]: unknown
}

interface StoreState {
  currentUser: User | null
  login: (username: string, password: string) => Promise<void>
  rooms: Room[]
  fetchRooms: (filters?: Record<string, string>) => Promise<void>
  updateRoomStatus: (id: number, status: string, operatorId: number) => Promise<void>
  inspections: Inspection[]
  fetchInspections: (filters?: Record<string, string>) => Promise<void>
  createInspection: (data: Record<string, unknown>) => Promise<void>
  updateInspection: (id: number, data: Record<string, unknown>) => Promise<void>
  requisitions: Requisition[]
  fetchRequisitions: (filters?: Record<string, string>) => Promise<void>
  createRequisition: (data: Record<string, unknown>) => Promise<void>
  linenReturns: LinenReturn[]
  createReturn: (data: Record<string, unknown>) => Promise<void>
  losses: Loss[]
  fetchLosses: (filters?: Record<string, string>) => Promise<void>
  createLoss: (data: Record<string, unknown>) => Promise<void>
  maintenanceOrders: MaintenanceOrder[]
  fetchMaintenance: (filters?: Record<string, string>) => Promise<void>
  createMaintenance: (data: Record<string, unknown>) => Promise<void>
  updateMaintenance: (id: number, data: Record<string, unknown>) => Promise<void>
  leftovers: Leftover[]
  fetchLeftovers: (filters?: Record<string, string>) => Promise<void>
  createLeftover: (data: Record<string, unknown>) => Promise<void>
  updateLeftover: (id: number, data: Record<string, unknown>) => Promise<void>
  stats: Stats
  fetchLinenLossStats: (params?: Record<string, string>) => Promise<void>
  fetchInspectionMissStats: (params?: Record<string, string>) => Promise<void>
  fetchMaintenanceResponseStats: (params?: Record<string, string>) => Promise<void>
  users: User[]
  fetchUsers: () => Promise<void>
  workstationData: WorkstationData | null
  fetchLinenWorkstation: (filters?: Record<string, string>) => Promise<void>
  confirmLinenRequisition: (id: string, operatorId: string, note?: string) => Promise<void>
  confirmLinenLoss: (id: string, confirmedBy: string, note?: string) => Promise<void>
  replaceLinenLoss: (id: string, operatorId: string, note?: string) => Promise<void>
  dispatchLinenLoss: (id: string, operatorId: string, engineerId?: string, note?: string) => Promise<void>
  verifyLinenReturn: (id: string, verifiedBy: string, notes?: string) => Promise<void>
  lossRecapData: LossRecapData | null
  fetchLinenLossRecap: (params?: Record<string, string>) => Promise<void>
  lossRecapFilter: LossRecapFilter
  setLossRecapFilter: (filter: LossRecapFilter) => void
}

const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const json = await res.json()
    if (json.success) set({ currentUser: json.data.user })
  },
  rooms: [],
  fetchRooms: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/rooms${query}`)
    const json = await res.json()
    if (json.success) set({ rooms: json.data })
  },
  updateRoomStatus: async (id, status, operatorId) => {
    const res = await fetch(`/api/rooms/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, operatorId }),
    })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...json.data } : r)),
      }))
    }
  },
  inspections: [],
  fetchInspections: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/inspections${query}`)
    const json = await res.json()
    if (json.success) set({ inspections: json.data })
  },
  createInspection: async (data) => {
    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ inspections: [...state.inspections, json.data] }))
  },
  updateInspection: async (id, data) => {
    const res = await fetch(`/api/inspections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        inspections: state.inspections.map((i) => (i.id === id ? { ...i, ...json.data } : i)),
      }))
    }
  },
  requisitions: [],
  fetchRequisitions: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/linen/requisitions${query}`)
    const json = await res.json()
    if (json.success) set({ requisitions: json.data })
  },
  createRequisition: async (data) => {
    const res = await fetch('/api/linen/requisitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ requisitions: [...state.requisitions, json.data] }))
  },
  linenReturns: [],
  createReturn: async (data) => {
    const res = await fetch('/api/linen/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ linenReturns: [...state.linenReturns, json.data] }))
  },
  losses: [],
  fetchLosses: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/linen/losses${query}`)
    const json = await res.json()
    if (json.success) set({ losses: json.data })
  },
  createLoss: async (data) => {
    const res = await fetch('/api/linen/losses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ losses: [...state.losses, json.data] }))
  },
  maintenanceOrders: [],
  fetchMaintenance: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/maintenance${query}`)
    const json = await res.json()
    if (json.success) set({ maintenanceOrders: json.data })
  },
  createMaintenance: async (data) => {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ maintenanceOrders: [...state.maintenanceOrders, json.data] }))
  },
  updateMaintenance: async (id, data) => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        maintenanceOrders: state.maintenanceOrders.map((m) => (m.id === id ? { ...m, ...json.data } : m)),
      }))
    }
  },
  leftovers: [],
  fetchLeftovers: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/leftovers${query}`)
    const json = await res.json()
    if (json.success) set({ leftovers: json.data })
  },
  createLeftover: async (data) => {
    const res = await fetch('/api/leftovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) set((state) => ({ leftovers: [...state.leftovers, json.data] }))
  },
  updateLeftover: async (id, data) => {
    const res = await fetch(`/api/leftovers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        leftovers: state.leftovers.map((l) => (l.id === id ? { ...l, ...json.data } : l)),
      }))
    }
  },
  stats: {},
  fetchLinenLossStats: async (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    const res = await fetch(`/api/statistics/linen-loss${query}`)
    const json = await res.json()
    if (json.success) set((state) => ({ stats: { ...state.stats, linenLoss: json.data } }))
  },
  fetchInspectionMissStats: async (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    const res = await fetch(`/api/statistics/inspection-miss${query}`)
    const json = await res.json()
    if (json.success) set((state) => ({ stats: { ...state.stats, inspectionMiss: json.data } }))
  },
  fetchMaintenanceResponseStats: async (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    const res = await fetch(`/api/statistics/maintenance-response${query}`)
    const json = await res.json()
    if (json.success) set((state) => ({ stats: { ...state.stats, maintenanceResponse: json.data } }))
  },
  users: [],
  fetchUsers: async () => {
    const res = await fetch('/api/auth/users')
    const json = await res.json()
    if (json.success) set({ users: json.data })
  },
  workstationData: null,
  fetchLinenWorkstation: async (filters) => {
    const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
    const res = await fetch(`/api/linen/workstation${query}`)
    const json = await res.json()
    if (json.success) set({ workstationData: json.data })
  },
  confirmLinenRequisition: async (id, operatorId, note) => {
    const res = await fetch(`/api/linen/requisitions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'fulfilled', operatorId, note }),
    })
    const json = await res.json()
    if (json.success) {
      const wd = get().workstationData
      if (wd) {
        set({
          workstationData: {
            ...wd,
            requisitions: wd.requisitions.map((r) =>
              r.id === id ? { ...r, status: 'fulfilled' } : r
            ),
            summary: {
              ...wd.summary,
              pending: wd.summary.pending - 1,
              fulfilled: wd.summary.fulfilled + 1,
            },
          },
        })
      }
    }
  },
  confirmLinenLoss: async (id, confirmedBy, note) => {
    const res = await fetch(`/api/linen/losses/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedBy, note }),
    })
    const json = await res.json()
    if (json.success) {
      const wd = get().workstationData
      if (wd) {
        set({
          workstationData: {
            ...wd,
            requisitions: wd.requisitions.map((r) => ({
              ...r,
              losses: r.losses.map((l) =>
                l.id === id
                  ? {
                      ...l,
                      status: 'confirmed',
                      confirmed_by: json.data.confirmed_by,
                      confirmed_at: json.data.confirmed_at,
                      confirmer_name: json.data.confirmer_name,
                    }
                  : l
              ),
            })),
            standaloneLosses: wd.standaloneLosses.map((l) =>
              l.id === id
                ? {
                    ...l,
                    status: 'confirmed',
                    confirmed_by: json.data.confirmed_by,
                    confirmed_at: json.data.confirmed_at,
                    confirmer_name: json.data.confirmer_name,
                  }
                : l
            ),
            summary: {
              ...wd.summary,
              unconfirmedLoss: Math.max(0, wd.summary.unconfirmedLoss - 1),
            },
          },
        })
      }
    }
  },
  replaceLinenLoss: async (id, operatorId, note) => {
    const res = await fetch(`/api/linen/losses/${id}/replace`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorId, note }),
    })
    if (res.ok) {
      const wd = get().workstationData
      if (wd) {
        set({
          workstationData: {
            ...wd,
            requisitions: wd.requisitions.map((r) => ({
              ...r,
              losses: r.losses.map((l) =>
                l.id === id ? { ...l, status: 'replaced' } : l
              ),
            })),
            standaloneLosses: wd.standaloneLosses.map((l) =>
              l.id === id ? { ...l, status: 'replaced' } : l
            ),
          },
        })
      }
    }
  },
  dispatchLinenLoss: async (id, operatorId, engineerId, note) => {
    const res = await fetch(`/api/linen/losses/${id}/dispatch`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorId, engineerId, note }),
    })
    const json = await res.json()
    if (json.success) {
      const wd = get().workstationData
      if (wd) {
        const patch = (l: any) =>
          l.id === id
            ? {
                ...l,
                status: 'dispatched',
                maintenance_order_id: json.data.maintenance_order_id,
                maintenance_status: json.data.maintenance_status,
                maintenance_fault_type: json.data.maintenance_fault_type,
                engineer_name: json.data.engineer_name,
              }
            : l
        set({
          workstationData: {
            ...wd,
            requisitions: wd.requisitions.map((r) => ({
              ...r,
              losses: r.losses.map(patch),
            })),
            standaloneLosses: wd.standaloneLosses.map(patch),
          },
        })
      }
    }
  },
  verifyLinenReturn: async (id, verifiedBy, notes) => {
    const res = await fetch(`/api/linen/returns/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiedBy, notes }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success) {
        const wd = get().workstationData
        if (wd) {
          set({
            workstationData: {
              ...wd,
              requisitions: wd.requisitions.map((r) => ({
                ...r,
                returns: r.returns.map((ret) =>
                  ret.id === id
                    ? {
                        ...ret,
                        verified_by: json.data.verified_by,
                        verified_at: json.data.verified_at,
                        notes: json.data.notes,
                      }
                    : ret
                ),
              })),
            },
          })
        }
      }
    }
  },
  lossRecapData: null,
  fetchLinenLossRecap: async (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    const res = await fetch(`/api/linen/losses/recap${query}`)
    const json = await res.json()
    if (json.success) set({ lossRecapData: json.data })
  },
  lossRecapFilter: { dimension: null, value: null, label: null },
  setLossRecapFilter: (filter) => set({ lossRecapFilter: filter }),
}))

export default useStore
