import { create } from 'zustand'

export type Role = 'front_desk' | 'doctor' | 'reviewer'

interface AppState {
  currentRole: Role
  setCurrentRole: (role: Role) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'front_desk',
  setCurrentRole: (role) => set({ currentRole: role }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
