import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || '')
  const username = computed(() => user.value?.username || '')
  const name = computed(() => user.value?.name || '')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const clearToken = () => {
    token.value = ''
    localStorage.removeItem('token')
  }

  const clearUser = () => {
    user.value = null
    localStorage.removeItem('user')
  }

  const handleLogin = async (credentials) => {
    const res = await login(credentials)
    setToken(res.token)
    setUser(res.user)
    return res
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      console.error('Logout API error:', e)
    } finally {
      clearToken()
      clearUser()
    }
  }

  const hasRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.includes(role.value)
  }

  return {
    token,
    user,
    isLoggedIn,
    role,
    username,
    name,
    setToken,
    setUser,
    clearToken,
    clearUser,
    login: handleLogin,
    logout: handleLogout,
    hasRole
  }
})
