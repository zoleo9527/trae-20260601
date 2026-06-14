import { ref } from 'vue'
import type { User, UserRole } from '@/types'
import usersData from '@/data/users.json'

const users = ref<User[]>(usersData as any[])
const currentUser = ref<User>(users.value[0])

export function useAuth() {
  const login = (userId: string) => {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
      localStorage.setItem('currentUserId', userId)
    }
  }

  const logout = () => {
    currentUser.value = users.value[0]
    localStorage.removeItem('currentUserId')
  }

  const switchUser = (role: UserRole) => {
    const user = users.value.find(u => u.role === role)
    if (user) {
      currentUser.value = user
      localStorage.setItem('currentUserId', user.id)
    }
  }

  const getUsersByRole = (role: UserRole) => {
    return users.value.filter(u => u.role === role)
  }

  const initAuth = () => {
    const storedUserId = localStorage.getItem('currentUserId')
    if (storedUserId) {
      const user = users.value.find(u => u.id === storedUserId)
      if (user) {
        currentUser.value = user
      }
    }
  }

  return {
    users,
    currentUser,
    login,
    logout,
    switchUser,
    getUsersByRole,
    initAuth
  }
}
