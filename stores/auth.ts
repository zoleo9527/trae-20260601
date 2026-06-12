import { defineStore } from 'pinia'
import type { User, UserRole } from '~/types'

const mockUsers: User[] = [
  { id: 'm1', name: '张明', role: 'manager', department: '招商部' },
  { id: 'm2', name: '李华', role: 'manager', department: '招商部' },
  { id: 'd1', name: '王芳', role: 'director', department: '招商部' },
  { id: 'e1', name: '赵强', role: 'engineer', department: '物业工程部' },
  { id: 'e2', name: '刘伟', role: 'engineer', department: '物业工程部' }
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    users: mockUsers
  }),
  
  getters: {
    isLoggedIn: (state) => state.currentUser !== null,
    userRole: (state) => state.currentUser?.role || null,
    roleName: (state) => {
      const roleMap: Record<UserRole, string> = {
        manager: '招商经理',
        director: '招商主管',
        engineer: '物业工程'
      }
      return state.currentUser ? roleMap[state.currentUser.role] : ''
    }
  },
  
  actions: {
    login(userId: string) {
      const user = this.users.find(u => u.id === userId)
      if (user) {
        this.currentUser = user
        useCookie('current_user_id').value = userId
      }
    },
    
    logout() {
      this.currentUser = null
      useCookie('current_user_id').value = null
    },
    
    switchRole(userId: string) {
      const user = this.users.find(u => u.id === userId)
      if (user) {
        this.currentUser = user
        useCookie('current_user_id').value = userId
      }
    },
    
    restoreSession() {
      const cookie = useCookie<string | null>('current_user_id')
      if (cookie.value) {
        const user = this.users.find(u => u.id === cookie.value)
        if (user) {
          this.currentUser = user
        }
      }
    },
    
    getUsersByRole(role: UserRole) {
      return this.users.filter(u => u.role === role)
    }
  }
})
