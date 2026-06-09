import { create } from 'zustand'
import type { Activity, PackageItem, TodayStats, UserRole } from '../../shared/types'

interface AppState {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  packages: PackageItem[]
  stats: TodayStats | null
  activities: Activity[]
  priorityItems: PriorityItem[]
  fetchPackages: (status?: string) => Promise<void>
  fetchPackage: (id: string) => Promise<PackageItem | null>
  checkin: (id: string, operator: string, role: UserRole, note?: string) => Promise<void>
  verify: (id: string, operator: string, role: UserRole, pickupPerson?: string, note?: string) => Promise<void>
  markProblem: (id: string, operator: string, role: UserRole, problemType: string, description: string) => Promise<void>
  resolveProblem: (id: string, operator: string, role: UserRole, resolution: string, action: 'recheckin' | 'return') => Promise<void>
  resetPackageStatus: (id: string, operator: string, role: UserRole, targetStatus: string, note?: string) => Promise<void>
  fetchStats: () => Promise<void>
  fetchActivities: (limit?: number) => Promise<void>
  fetchPriorityItems: (limit?: number) => Promise<void>
  resetAllData: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'customer_service',
  setCurrentRole: (role) => set({ currentRole: role }),

  packages: [],
  stats: null,
  activities: [],
  priorityItems: [],

  fetchPackages: async (status?: string) => {
    const url = status ? `/api/packages?status=${status}` : '/api/packages'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) set({ packages: json.data })
  },

  fetchPackage: async (id: string) => {
    const res = await fetch(`/api/packages/${id}`)
    const json = await res.json()
    if (json.success) return json.data
    return null
  },

  checkin: async (id, operator, role, note) => {
    const res = await fetch(`/api/packages/${id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, role, note }),
    })
    const json = await res.json()
    if (json.success) {
      const pkgs = get().packages.map(p => p.id === id ? json.data : p)
      set({ packages: pkgs })
      get().fetchStats()
      get().fetchActivities()
    }
  },

  verify: async (id, operator, role, pickupPerson, note) => {
    const res = await fetch(`/api/packages/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, role, pickupPerson, note }),
    })
    const json = await res.json()
    if (json.success) {
      const pkgs = get().packages.map(p => p.id === id ? json.data : p)
      set({ packages: pkgs })
      get().fetchStats()
      get().fetchActivities()
    }
  },

  markProblem: async (id, operator, role, problemType, description) => {
    const res = await fetch(`/api/packages/${id}/problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, role, problemType, description }),
    })
    const json = await res.json()
    if (json.success) {
      const pkgs = get().packages.map(p => p.id === id ? json.data : p)
      set({ packages: pkgs })
      get().fetchStats()
      get().fetchActivities()
    }
  },

  resolveProblem: async (id, operator, role, resolution, action) => {
    const res = await fetch(`/api/packages/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, role, resolution, action }),
    })
    const json = await res.json()
    if (json.success) {
      const pkgs = get().packages.map(p => p.id === id ? json.data : p)
      set({ packages: pkgs })
      get().fetchStats()
      get().fetchActivities()
    }
  },

  resetPackageStatus: async (id, operator, role, targetStatus, note) => {
    const res = await fetch(`/api/packages/${id}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, role, targetStatus, note }),
    })
    const json = await res.json()
    if (json.success) {
      const pkgs = get().packages.map(p => p.id === id ? json.data : p)
      set({ packages: pkgs })
      get().fetchStats()
      get().fetchActivities()
    }
  },

  fetchStats: async () => {
    const res = await fetch('/api/stats/today')
    const json = await res.json()
    if (json.success) set({ stats: json.data })
  },

  fetchActivities: async (limit = 20) => {
    const res = await fetch(`/api/activities?limit=${limit}`)
    const json = await res.json()
    if (json.success) set({ activities: json.data })
  },

  fetchPriorityItems: async (limit = 10) => {
    const res = await fetch(`/api/stats/priority?limit=${limit}`)
    const json = await res.json()
    if (json.success) set({ priorityItems: json.data })
  },

  resetAllData: async () => {
    await fetch('/api/reset', { method: 'POST' })
    await get().fetchPackages()
    await get().fetchStats()
    await get().fetchActivities()
    await get().fetchPriorityItems()
  },
}))
