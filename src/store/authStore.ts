import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserRole = '客服' | '派件员' | '驿站负责人'

interface User {
  id: number
  username: string
  role: UserRole
  displayName: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  setUser: (user: User) => void
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '登录失败')
        }
        const json = await res.json()
        set({
          token: json.data.token,
          user: json.data.user,
          isAuthenticated: true,
        })
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      },

      fetchUser: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            set({ token: null, user: null, isAuthenticated: false })
            return
          }
          const json = await res.json()
          set({ user: json.data, isAuthenticated: true })
        } catch {
          set({ token: null, user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.fetchUser()
        }
      },
    }
  )
)
