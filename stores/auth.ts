import { defineStore } from 'pinia'
import type { CaseReport, MaterialList, OperationLog, Role } from '~/types'

interface AuthState {
  currentUser: {
    id: string
    name: string
    role: Role
  } | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUser: null
  }),
  
  actions: {
    setUser(user: AuthState['currentUser']) {
      this.currentUser = user
    },
    
    switchRole(role: Role) {
      const users: Record<Role, { id: string; name: string; role: Role }> = {
        CLAIM_AGENT: { id: 'agent-001', name: '张三', role: 'CLAIM_AGENT' },
        SURVEYOR: { id: 'surveyor-001', name: '李四', role: 'SURVEYOR' },
        UNDERWRITER: { id: 'underwriter-001', name: '王五', role: 'UNDERWRITER' }
      }
      this.currentUser = users[role]
    }
  }
})
