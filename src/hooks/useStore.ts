import { create } from 'zustand'

type UserRole = 'gate_operator' | 'dispatcher' | 'customer_service'

interface AppState {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'dispatcher',
  setCurrentRole: (role) => set({ currentRole: role }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
