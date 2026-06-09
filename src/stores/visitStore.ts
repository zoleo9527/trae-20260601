import { create } from 'zustand'

export interface Visit {
  id: number
  animal_id: number
  adoption_id: number
  status: string
  visit_date: string
  notes: string
  [key: string]: unknown
}

interface FetchVisitsParams {
  status?: string
  animal_id?: number
  adoption_id?: number
}

interface VisitState {
  visits: Visit[]
  currentVisit: Visit | null
  loading: boolean
  fetchVisits: (params?: FetchVisitsParams) => Promise<void>
  fetchVisit: (id: number) => Promise<void>
  createVisit: (data: Partial<Visit>) => Promise<void>
  updateVisit: (id: number, data: Partial<Visit>) => Promise<void>
  batchUpdate: (ids: number[], data: Partial<Visit>) => Promise<void>
}

export const useVisitStore = create<VisitState>((set) => ({
  visits: [],
  currentVisit: null,
  loading: false,

  fetchVisits: async (params = {}) => {
    set({ loading: true })
    try {
      const query = new URLSearchParams()
      if (params.status) query.set('status', params.status)
      if (params.animal_id) query.set('animal_id', String(params.animal_id))
      if (params.adoption_id) query.set('adoption_id', String(params.adoption_id))
      const res = await fetch(`/api/visits?${query.toString()}`)
      if (!res.ok) throw new Error('获取回访记录失败')
      const data = await res.json()
      set({ visits: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  fetchVisit: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/visits/${id}`)
      if (!res.ok) throw new Error('获取回访详情失败')
      const data = await res.json()
      set({ currentVisit: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  createVisit: async (data) => {
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('创建回访记录失败')
  },

  updateVisit: async (id, data) => {
    const res = await fetch(`/api/visits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('更新回访记录失败')
  },

  batchUpdate: async (ids, data) => {
    const res = await fetch('/api/visits/batch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, ...data }),
    })
    if (!res.ok) throw new Error('批量更新回访记录失败')
  },
}))
