import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Role } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role)
  const roleName = computed(() => {
    const map: Record<Role, string> = {
      nurse: '手术护士',
      surgeon: '主刀医生',
      specialist: '随访专员'
    }
    return user.value ? map[user.value.role] : ''
  })

  function login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users: Record<string, User> = {
          nurse: { id: '1', username: 'nurse', name: '张护士', role: 'nurse' },
          surgeon: { id: '2', username: 'surgeon', name: '李医生', role: 'surgeon' },
          specialist: { id: '3', username: 'specialist', name: '王专员', role: 'specialist' }
        }
        const foundUser = users[username]
        if (foundUser && password === '123456') {
          user.value = foundUser
          localStorage.setItem('user', JSON.stringify(foundUser))
          resolve(true)
        } else {
          resolve(false)
        }
      }, 300)
    })
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
  }

  function restoreSession() {
    const saved = localStorage.getItem('user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  return {
    user,
    isAuthenticated,
    role,
    roleName,
    login,
    logout,
    restoreSession
  }
})
