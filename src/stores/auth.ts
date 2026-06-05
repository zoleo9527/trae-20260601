import { create } from 'zustand'
import type { User } from '../shared/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      const { token, user } = data

      localStorage.setItem('brewery_token', token)
      localStorage.setItem('brewery_user', JSON.stringify(user))

      set({ token, user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      const token = get().token
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } finally {
      localStorage.removeItem('brewery_token')
      localStorage.removeItem('brewery_user')
      set({ user: null, token: null, isLoading: false })
    }
  },

  loadUser: async () => {
    set({ isLoading: true })
    try {
      const token = get().token
      if (!token) {
        throw new Error('No token available')
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load user')
      }

      const user = await response.json()
      localStorage.setItem('brewery_user', JSON.stringify(user))
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('brewery_token')
    const userStr = localStorage.getItem('brewery_user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ token, user })
      } catch {
        localStorage.removeItem('brewery_token')
        localStorage.removeItem('brewery_user')
      }
    }
  },
}))
