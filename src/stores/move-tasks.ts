import { create } from 'zustand'
import { moveTaskApi, type MoveTask, type MoveTaskHistory } from '@/lib/api'

interface MoveTasksState {
  tasks: MoveTask[]
  current: MoveTask | null
  history: MoveTaskHistory | null
  loading: boolean
  fetchTasks: (params?: { status?: string; containerId?: number }) => Promise<void>
  createTask: (data: { containerId: number; fromSlot: string; toSlot: string; reason: string; sourceInspectionId?: number }) => Promise<void>
  executeTask: (id: number, data: { action: 'start' | 'complete'; remark?: string }) => Promise<void>
  fetchTaskHistory: (id: number) => Promise<void>
}

export const useMoveTasksStore = create<MoveTasksState>((set) => ({
  tasks: [],
  current: null,
  history: null,
  loading: false,

  fetchTasks: async (params) => {
    set({ loading: true })
    try {
      const tasks = await moveTaskApi.list({
        status: params?.status,
        container_id: params?.containerId,
      })
      set({ tasks, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createTask: async (data) => {
    await moveTaskApi.create({
      container_id: data.containerId,
      from_slot: data.fromSlot,
      to_slot: data.toSlot,
      reason: data.reason,
      source_inspection_id: data.sourceInspectionId,
    })
  },

  executeTask: async (id, data) => {
    const updated = await moveTaskApi.execute(id, data)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      current: state.current?.id === id ? updated : state.current,
    }))
  },

  fetchTaskHistory: async (id) => {
    try {
      const history = await moveTaskApi.history(id)
      set({ history })
    } catch {
      set({ history: null })
    }
  },
}))
