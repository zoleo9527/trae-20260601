import { create } from 'zustand'

interface User {
  id: number
  name: string
  role: string
  counterId: number | null
  brandId: number | null
  avatar: string
}

interface AuthState {
  user: User | null
  accounts: any[]
  login: (role: string, staffId?: number) => Promise<void>
  logout: () => void
  loadAccounts: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accounts: [],
  login: async (role: string, staffId?: number) => {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, staffId }),
    })
    const json = await res.json()
    if (json.success) {
      set({ user: json.data })
    }
  },
  logout: () => set({ user: null }),
  loadAccounts: async () => {
    const res = await fetch('/api/auth/demo-accounts')
    const json = await res.json()
    if (json.success) {
      set({ accounts: json.data })
    }
  },
}))
