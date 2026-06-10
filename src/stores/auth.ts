import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types'
import { authApi } from '../api/resources'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)

  function loadFromStorage() {
    const stored = localStorage.getItem('orchard_user')
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem('orchard_user')
      }
    }
  }

  async function login(username: string) {
    const res = await authApi.login(username)
    currentUser.value = res.data
    localStorage.setItem('orchard_user', JSON.stringify(res.data))
    return res.data
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('orchard_user')
  }

  loadFromStorage()

  return { currentUser, login, logout, loadFromStorage }
})
