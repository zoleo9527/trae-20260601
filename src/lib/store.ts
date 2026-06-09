import { create } from 'zustand'
import type { Role, AppNotification } from '@/lib/types'
import { ROLE_USERS } from '@/lib/types'
import { api } from '@/lib/api'

interface AppState {
  currentRole: Role
  currentUser: string
  notifications: AppNotification[]
  sidebarCollapsed: boolean
  setRole: (role: Role) => void
  setUser: (user: string) => void
  toggleSidebar: () => void
  fetchNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'doctor',
  currentUser: ROLE_USERS.doctor[0].name,
  notifications: [],
  sidebarCollapsed: false,

  setRole: (role: Role) => {
    const user = ROLE_USERS[role][0].name
    set({ currentRole: role, currentUser: user })
    get().fetchNotifications()
  },

  setUser: (user: string) => {
    set({ currentUser: user })
  },

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
  },

  fetchNotifications: async () => {
    try {
      const role = get().currentRole
      const notifs = await api.notifications.list(role)
      set({ notifications: notifs })
    } catch {
      set({ notifications: [] })
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      await api.notifications.markRead(id)
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        ),
      }))
    } catch {}
  },
}))
