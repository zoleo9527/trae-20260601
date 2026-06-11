import { create } from 'zustand'

interface User {
  id: number
  name: string
  role: string
  counterId: number | null
  avatar: string
}

interface AuthState {
  user: User | null
  login: (role: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (role: string) => {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    set({ user: data.user ?? data })
  },
  logout: () => set({ user: null }),
}))
