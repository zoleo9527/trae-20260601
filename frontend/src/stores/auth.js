import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')

  async function login(username, password) {
    const result = await authApi.login({ username, password })
    token.value = result.access_token
    user.value = result.user
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function canAccess(roles) {
    if (!roles || roles.length === 0) return true
    return roles.includes(userRole.value)
  }

  return {
    token,
    user,
    isLoggedIn,
    userRole,
    userName,
    login,
    logout,
    canAccess
  }
})
