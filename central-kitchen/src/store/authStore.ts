import { create } from 'zustand'
import type { User, Role } from '@/types'
import { ROLE_PERMISSIONS } from '@/constants/statusMachine'

interface AuthState {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  switchRole: (role: Role) => void
  hasPermission: (action: string) => boolean
  canAccessMenu: (menuItem: string) => boolean
}

const mockUsers: Record<Role, User> = {
  purchase_manager: {
    id: 'user-1',
    name: '张采购',
    role: 'purchase_manager',
  },
  production_leader: {
    id: 'user-2',
    name: '李班长',
    role: 'production_leader',
  },
  store_supervisor: {
    id: 'user-3',
    name: '王督导',
    role: 'store_supervisor',
  },
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: mockUsers.production_leader,

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role) => {
    set({ currentUser: mockUsers[role] })
  },

  hasPermission: (action) => {
    const { currentUser } = get()
    if (!currentUser) return false
    const permissions = ROLE_PERMISSIONS[currentUser.role]
    return permissions.allowedActions.includes(action)
  },

  canAccessMenu: (menuItem) => {
    const { currentUser } = get()
    if (!currentUser) return false
    const permissions = ROLE_PERMISSIONS[currentUser.role]
    return permissions.menuItems.includes(menuItem)
  },
}))
