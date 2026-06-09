import { create } from 'zustand'

export interface Recall {
  id: number
  status: string
  animal_id: number
  adoption_id: number
  reason: string
  [key: string]: unknown
}

interface FetchRecallsParams {
  status?: string
}

interface RecallState {
  recalls: Recall[]
  currentRecall: Recall | null
  loading: boolean
  fetchRecalls: (params?: FetchRecallsParams) => Promise<void>
  fetchRecall: (id: number) => Promise<void>
  createRecall: (data: Partial<Recall>) => Promise<void>
  updateRecall: (id: number, data: Partial<Recall>) => Promise<void>
}

export const useRecallStore = create<RecallState>((set) => ({
  recalls: [],
  currentRecall: null,
  loading: false,

  fetchRecalls: async (params = {}) => {
    set({ loading: true })
    try {
      const query = new URLSearchParams()
      if (params.status) query.set('status', params.status)
      const res = await fetch(`/api/recalls?${query.toString()}`)
      if (!res.ok) throw new Error('获取异常收回列表失败')
      const data = await res.json()
      set({ recalls: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  fetchRecall: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/recalls/${id}`)
      if (!res.ok) throw new Error('获取异常收回详情失败')
      const data = await res.json()
      set({ currentRecall: data.data ?? data })
    } finally {
      set({ loading: false })
    }
  },

  createRecall: async (data) => {
    const res = await fetch('/api/recalls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('创建异常收回失败')
  },

  updateRecall: async (id, data) => {
    const res = await fetch(`/api/recalls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('更新异常收回失败')
  },
}))
