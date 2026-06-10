import { create } from 'zustand'
import type { UserRole } from '@/types'

interface DetailPanelState {
  isOpen: boolean
  entityType: 'batch' | 'sample' | null
  entityId: string | null
}

interface UIState {
  sidebarCollapsed: boolean
  currentRole: UserRole
  detailPanel: DetailPanelState
  toggleSidebar: () => void
  setCurrentRole: (role: UserRole) => void
  openDetailPanel: (entityType: 'batch' | 'sample', entityId: string) => void
  closeDetailPanel: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentRole: 'manager',
  detailPanel: {
    isOpen: false,
    entityType: null,
    entityId: null,
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentRole: (role) => set({ currentRole: role }),
  openDetailPanel: (entityType, entityId) =>
    set({ detailPanel: { isOpen: true, entityType, entityId } }),
  closeDetailPanel: () =>
    set({ detailPanel: { isOpen: false, entityType: null, entityId: null } }),
}))
