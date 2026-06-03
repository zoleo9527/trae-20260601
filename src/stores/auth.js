import { defineStore } from 'pinia'
import { ROLES } from '@/data/mockData'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentRoleKey: 'frontline'
  }),

  getters: {
    currentRole: (state) => ROLES[state.currentRoleKey],
    hasPermission: (state) => (permission) => {
      const role = ROLES[state.currentRoleKey]
      if (!role) return false
      if (role.permissions.includes('*')) return true
      return role.permissions.includes(permission)
    }
  },

  actions: {
    switchRole(roleKey) {
      if (ROLES[roleKey]) {
        this.currentRoleKey = roleKey
      }
    },
    getRoleInfo(roleKey) {
      return ROLES[roleKey] || null
    }
  }
})
