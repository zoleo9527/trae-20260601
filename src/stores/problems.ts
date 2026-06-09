import { create } from 'zustand'
import { problemApi, type ProblemOrder, type ProblemDetail } from '@/lib/api'

interface ProblemsState {
  problems: ProblemOrder[]
  current: ProblemDetail | null
  loading: boolean
  fetchProblems: (params?: { type?: string; status?: string; severity?: string }) => Promise<void>
  fetchProblem: (id: number) => Promise<void>
  takeAction: (id: number, data: { action: 'reschedule' | 'supplement' | 'reject'; data: Record<string, unknown>; remark: string }) => Promise<ProblemOrder>
  detect: () => Promise<ProblemOrder[]>
  resolve: (id: number) => Promise<ProblemOrder>
}

export const useProblemsStore = create<ProblemsState>((set) => ({
  problems: [],
  current: null,
  loading: false,

  fetchProblems: async (params) => {
    set({ loading: true })
    try {
      const problems = await problemApi.list(params)
      set({ problems, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchProblem: async (id) => {
    set({ loading: true })
    try {
      const current = await problemApi.get(id)
      set({ current, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  takeAction: async (id, data) => {
    const updated = await problemApi.takeAction(id, data)
    set((state) => ({
      problems: state.problems.map((p) => (p.id === id ? updated : p)),
    }))
    return updated
  },

  detect: async () => {
    const problems = await problemApi.detect()
    return problems
  },

  resolve: async (id) => {
    const updated = await problemApi.resolve(id)
    set((state) => ({
      problems: state.problems.map((p) => (p.id === id ? updated : p)),
    }))
    return updated
  },
}))
