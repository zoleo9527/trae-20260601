import { create } from 'zustand'
import { inspectionApi, type Inspection } from '@/lib/api'

interface InspectionsState {
  inspections: Inspection[]
  current: Inspection | null
  loading: boolean
  fetchInspections: (params?: { status?: string; containerId?: number }) => Promise<void>
  createInspection: (data: { containerId: number; type: 'open' | 'full' | 'random'; plannedAt: string }) => Promise<void>
  executeInspection: (id: number, data: { step: 'open_box' | 'unpack' | 'repack' | 'result'; result?: 'released' | 'abnormal' | 'detained'; remark?: string }) => Promise<void>
  notifyInspection: (id: number, data: { method: 'sms' | 'email' | 'phone' }) => Promise<void>
}

export const useInspectionsStore = create<InspectionsState>((set) => ({
  inspections: [],
  current: null,
  loading: false,

  fetchInspections: async (params) => {
    set({ loading: true })
    try {
      const inspections = await inspectionApi.list({
        status: params?.status,
        container_id: params?.containerId,
      })
      set({ inspections, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createInspection: async (data) => {
    await inspectionApi.create({
      container_id: data.containerId,
      type: data.type,
      planned_at: data.plannedAt,
    })
  },

  executeInspection: async (id, data) => {
    const updated = await inspectionApi.execute(id, {
      step: data.step,
      result: data.result,
      remark: data.remark,
    })
    set((state) => ({
      inspections: state.inspections.map((i) => (i.id === id ? updated : i)),
      current: state.current?.id === id ? updated : state.current,
    }))
  },

  notifyInspection: async (id, data) => {
    const updated = await inspectionApi.notify(id, {
      notify_method: data.method,
    })
    set((state) => ({
      inspections: state.inspections.map((i) => (i.id === id ? updated : i)),
      current: state.current?.id === id ? updated : state.current,
    }))
  },
}))
