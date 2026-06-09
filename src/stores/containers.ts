import { create } from 'zustand'
import { containerApi, type Container, type ContainerDetail } from '@/lib/api'

interface ContainersState {
  containers: Container[]
  total: number
  current: ContainerDetail | null
  loading: boolean
  fetchContainers: (params?: { status?: string; search?: string; page?: number; size?: number }) => Promise<void>
  fetchContainer: (id: number) => Promise<void>
  createContainer: (data: { container_no: string; vessel: string; voyage: string; target_port: string; yard_slot?: string; free_storage_until?: string }) => Promise<void>
  updateStatus: (id: number, data: { status: string; remark?: string }) => Promise<void>
}

export const useContainersStore = create<ContainersState>((set) => ({
  containers: [],
  total: 0,
  current: null,
  loading: false,

  fetchContainers: async (params) => {
    set({ loading: true })
    try {
      const res = await containerApi.list(params)
      set({ containers: res.list, total: res.total, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchContainer: async (id) => {
    set({ loading: true })
    try {
      const current = await containerApi.get(id)
      set({ current, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createContainer: async (data) => {
    await containerApi.create(data)
  },

  updateStatus: async (id, data) => {
    await containerApi.updateStatus(id, data)
  },
}))
