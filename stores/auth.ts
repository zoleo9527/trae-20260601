import { defineStore } from 'pinia'

interface User {
  userId: number
  username: string
  realName: string
  role: string
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: (): { user: User | null } => ({
    user: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role || '',
    isProjectManager: (state) => state.user?.role === 'PROJECT_MANAGER',
    isConstructionLeader: (state) => state.user?.role === 'CONSTRUCTION_LEADER',
    isAfterSalesEngineer: (state) => state.user?.role === 'AFTER_SALES_ENGINEER'
  },
  actions: {
    async login(username: string, password: string) {
      const response = await $fetch<{ success: boolean; message: string; data: any }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      
      if (response.success) {
        this.user = {
          userId: response.data.userId,
          username: response.data.username,
          realName: response.data.realName,
          role: response.data.role,
          token: response.data.token
        }
        localStorage.setItem('auth_user', JSON.stringify(this.user))
        return true
      }
      throw new Error(response.message)
    },
    logout() {
      this.user = null
      localStorage.removeItem('auth_user')
    },
    restoreSession() {
      const saved = localStorage.getItem('auth_user')
      if (saved) {
        this.user = JSON.parse(saved)
      }
    },
    getAuthHeaders() {
      return {
        'Authorization': `Bearer ${this.user?.token}`,
        'Content-Type': 'application/json'
      }
    }
  }
})
