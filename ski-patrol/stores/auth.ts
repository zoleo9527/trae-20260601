interface User {
  id: number
  name: string
  role: 'rental' | 'coach' | 'patrol'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    roleName: (state) => {
      if (!state.user) return ''
      const map: Record<string, string> = { rental: '租赁员', coach: '教练主管', patrol: '安全巡逻员' }
      return map[state.user.role] || state.user.role
    },
  },

  actions: {
    async login(role: string) {
      this.loading = true
      try {
        const res = await $fetch('/api/auth/login', {
          method: 'POST',
          params: { role },
        }) as any
        this.user = res.user
        return res
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      try {
        const res = await $fetch('/api/auth/me') as any
        this.user = res
      } catch {
        this.user = null
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      this.user = null
    },
  },
})
