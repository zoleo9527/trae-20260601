import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleName } from '@/types'
import { ROLE_CONFIGS } from '@/types'

interface RoleState {
  currentRole: RoleName
  permissions: string[]
  switchRole: (role: RoleName) => void
  hasPermission: (perm: string) => boolean
}

const getPermissions = (role: RoleName): string[] => {
  const config = ROLE_CONFIGS.find((c) => c.name === role)
  return config ? config.permissions : []
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      currentRole: 'dispatcher' as RoleName,
      permissions: getPermissions('dispatcher'),
      switchRole: (role: RoleName) => {
        set({ currentRole: role, permissions: getPermissions(role) })
      },
      hasPermission: (perm: string) => {
        return get().permissions.includes(perm)
      },
    }),
    { name: 'vehicle-role-store' }
  )
)
