import { defineStore } from 'pinia'
import type { UserRole, UserInfo } from '../types'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentRole: 'operation' as UserRole,
    currentUser: {
      id: '1',
      name: '李明',
      role: 'operation' as UserRole
    } as UserInfo,
    userList: [
      { id: '1', name: '李明', role: 'operation' as UserRole },
      { id: '2', name: '张伟', role: 'customs' as UserRole },
      { id: '3', name: '陈强', role: 'warehouse' as UserRole }
    ] as UserInfo[]
  }),
  actions: {
    setRole(role: UserRole) {
      this.currentRole = role
      const user = this.userList.find(u => u.role === role)
      if (user) {
        this.currentUser = user
      }
    }
  }
})
