import { create } from 'zustand'
import type { SafeUser, Customer, Handover, Note, DashboardStats } from '@/types/types'

interface AppState {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  currentUser: SafeUser | null
  setCurrentUser: (user: SafeUser | null) => void
  
  selectedCustomer: Customer | null
  setSelectedCustomer: (customer: Customer | null) => void
  
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats | null) => void
  
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  
  notifications: [],
  addNotification: (message, type) => 
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now().toString(), message, type },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))

interface CustomerCache {
  customers: Customer[]
  total: number
  page: number
  pageSize: number
}

interface CustomerStore {
  cache: Map<string, CustomerCache>
  setCache: (key: string, data: CustomerCache) => void
  getCache: (key: string) => CustomerCache | undefined
  clearCache: () => void
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  cache: new Map(),
  setCache: (key, data) => {
    const newCache = new Map(get().cache)
    newCache.set(key, data)
    set({ cache: newCache })
  },
  getCache: (key) => get().cache.get(key),
  clearCache: () => set({ cache: new Map() }),
}))

interface HandoverCache {
  handovers: Handover[]
  total: number
  page: number
  pageSize: number
}

interface HandoverStore {
  cache: Map<string, HandoverCache>
  setCache: (key: string, data: HandoverCache) => void
  getCache: (key: string) => HandoverCache | undefined
  clearCache: () => void
}

export const useHandoverStore = create<HandoverStore>((set, get) => ({
  cache: new Map(),
  setCache: (key, data) => {
    const newCache = new Map(get().cache)
    newCache.set(key, data)
    set({ cache: newCache })
  },
  getCache: (key) => get().cache.get(key),
  clearCache: () => set({ cache: new Map() }),
}))

interface NoteCache {
  notes: Note[]
  total: number
  page: number
  pageSize: number
}

interface NoteStore {
  cache: Map<string, NoteCache>
  setCache: (key: string, data: NoteCache) => void
  getCache: (key: string) => NoteCache | undefined
  clearCache: () => void
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  cache: new Map(),
  setCache: (key, data) => {
    const newCache = new Map(get().cache)
    newCache.set(key, data)
    set({ cache: newCache })
  },
  getCache: (key) => get().cache.get(key),
  clearCache: () => set({ cache: new Map() }),
}))