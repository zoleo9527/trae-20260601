import { create } from 'zustand'
import { authApi, type MeResponse } from '@/lib/api'

interface AuthState {
  token: string | null
  user: MeResponse | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    localStorage.setItem('token', res.token)
    const user = await authApi.me()
    set({ token: res.token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.me()
        .then((user) => set({ token, user, isAuthenticated: true }))
        .catch(() => {
          localStorage.removeItem('token')
          set({ token: null, user: null, isAuthenticated: false })
        })
    }
  },
}))
