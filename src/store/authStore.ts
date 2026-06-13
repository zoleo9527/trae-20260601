import { create } from 'zustand'

export type UserRole = 'operator' | 'consultant' | 'hr'

export interface User {
  id: number
  username: string
  role: UserRole
}

interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  loadUser: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  
  login: async (username, password, role) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      })
      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        set({ user: data.user, token: data.token })
        return true
      }
      return false
    } catch {
      return false
    }
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  
  loadUser: async () => {
    const token = get().token
    if (!token) return
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success) {
        set({ user: data.user })
      } else {
        get().logout()
      }
    } catch {
      get().logout()
    }
  }
}))