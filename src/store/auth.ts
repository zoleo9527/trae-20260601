import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { api } from '@/api/client'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
}

const DEMO_ACCOUNTS: Record<UserRole, { username: string; password: string }> = {
  consultant: { username: 'consultant', password: 'demo123' },
  assistant: { username: 'assistant', password: 'demo123' },
  service: { username: 'service', password: 'demo123' },
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const data = await api.auth.login(username, password)
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const user = await api.auth.me()
      set({ user, token })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  switchRole: async (role: UserRole) => {
    const account = DEMO_ACCOUNTS[role]
    if (!account) return

    set({ isLoading: true })
    try {
      const data = await api.auth.login(account.username, account.password)
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
