import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.real_name || '')

  async function login(username, password) {
    const data = await authApi.login({ username, password })
    token.value = data.access_token
    user.value = {
      id: data.user_id,
      username: data.username,
      real_name: data.real_name,
      role: data.role
    }
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(user.value))
    return data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    userName,
    login,
    logout
  }
})
