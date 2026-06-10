import { create } from 'zustand'
import { UserRole } from '../types'

interface UserState {
  user: {
    id: number
    username: string
    name: string
    role: UserRole
  } | null
  setUser: (user: { id: number; username: string; name: string; role: UserRole }) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))