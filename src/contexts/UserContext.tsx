import { create } from 'zustand'
import type { User } from '@/types'

interface UserState {
  currentUser: User | null
  users: User[]
  
  setCurrentUser: (user: User) => void
  loadUsers: () => void
  switchUser: (userId: string) => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  users: [],
  
  setCurrentUser: (user: User) => {
    set({ currentUser: user })
  },
  
  loadUsers: () => {
    const data = localStorage.getItem('users')
    const users: User[] = data ? JSON.parse(data) : []
    set({ users })
    
    if (users.length > 0 && !useUserStore.getState().currentUser) {
      set({ currentUser: users[0] })
    }
  },
  
  switchUser: (userId: string) => {
    const users = useUserStore.getState().users
    const user = users.find(u => u.id === userId)
    if (user) {
      set({ currentUser: user })
    }
  },
}))