import { create } from 'zustand'

export interface User {
  id: number
  name: string
  role: 'volunteer' | 'vet' | 'adoption_officer' | 'admin'
  phone: string
}

interface AuthState {
  user: User | null
  login: (name: string, role: User['role']) => Promise<void>
  logout: () => void
  loadFromStorage: () => void
}

const STORAGE_KEY = 'rescue_station_user'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  login: async (name, role) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role }),
    })
    if (!res.ok) throw new Error('登录失败')
    const data = await res.json()
    const user: User = data.user ?? data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null })
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        set({ user: JSON.parse(raw) })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}))
