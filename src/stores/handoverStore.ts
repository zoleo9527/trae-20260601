import { create } from 'zustand'

export interface Handover {
  id: number
  status: string
  from_user_id: number
  to_user_id: number
  notes: string
  [key: string]: unknown
}

interface HandoverState {
  handovers: Handover[]
  currentHandover: Handover | null
  loading: boolean
  fetchHandovers: () => Promise<void>
  fetchHandover: (id: number) => Promise<void>
  createHandover: (data: Partial<Handover>) => Promise<void>
  confirmHandover: (id: number) => Promise<void>
}

export const useHandoverStore = create<HandoverState>((set) => ({
  handovers: [],
  currentHandover: null,
  loading: false,

  fetchHandovers: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/handover')
      if (!res.ok) throw new Error('获取交班记录失败')
      const data = await res.json()
      set({ handovers: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  fetchHandover: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/handover/${id}`)
      if (!res.ok) throw new Error('获取交班详情失败')
      const data = await res.json()
      set({ currentHandover: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  createHandover: async (data) => {
    const res = await fetch('/api/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('创建交班记录失败')
    const created = await res.json()
    set({ currentHandover: created })
    return created
  },

  confirmHandover: async (id) => {
    const res = await fetch(`/api/handover/${id}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('确认交班失败')
  },
}))
