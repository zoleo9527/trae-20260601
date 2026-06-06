import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  const login = (role: User['role'], name: string) => {
    user.value = { role, name }
    localStorage.setItem('user', JSON.stringify({ role, name }))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
  }

  const initUser = () => {
    const saved = localStorage.getItem('user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  const hasPermission = (allowedRoles: User['role'][]) => {
    if (!user.value) return false
    return allowedRoles.includes(user.value.role)
  }

  return { user, login, logout, initUser, hasPermission }
})
