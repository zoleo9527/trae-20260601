import { create } from 'zustand'
import { UserRole } from '@/lib/types'

interface AuthState {
  userId: string | null
  userName: string | null
  userRole: UserRole | null
  hydrated: boolean
  login: (userId: string, userName: string, role: UserRole) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userName: null,
  userRole: null,
  hydrated: false,
  login: (userId, userName, role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rehab_auth', JSON.stringify({ userId, userName, userRole: role }))
    }
    set({ userId, userName, userRole: role })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rehab_auth')
    }
    set({ userId: null, userName: null, userRole: null })
  },
  hydrate: () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('rehab_auth')
        if (stored) {
          const data = JSON.parse(stored)
          set({ userId: data.userId, userName: data.userName, userRole: data.userRole, hydrated: true })
        } else {
          set({ hydrated: true })
        }
      } catch {
        set({ hydrated: true })
      }
    }
  },
}))
