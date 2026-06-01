import { create } from 'zustand'
import { RoleType } from '@/lib/constants'

interface User {
  id: string
  email: string
  name: string
  role: RoleType
  supplierId?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

const STORAGE_KEY = 'outsourcing-auth'

const getStoredAuth = (): Partial<AuthState> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = getStoredAuth()
  
  return {
    user: stored.user || null,
    isAuthenticated: stored.isAuthenticated || false,
    login: (user) => {
      const state = { user, isAuthenticated: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      set(state)
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({ user: null, isAuthenticated: false })
    },
  }
})
