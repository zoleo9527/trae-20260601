import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { users as mockUsers } from '@/data/mockData'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User>(mockUsers[0])
  const users = ref<User[]>(mockUsers)

  const setCurrentUser = (user: User) => {
    currentUser.value = user
  }

  const getUserById = (id: string): User | undefined => {
    return users.value.find(u => u.id === id)
  }

  const getUsersByRole = (role: 'project_manager' | 'translator' | 'reviewer'): User[] => {
    return users.value.filter(u => u.role === role)
  }

  return {
    currentUser,
    users,
    setCurrentUser,
    getUserById,
    getUsersByRole,
  }
}, {
  persist: true,
})