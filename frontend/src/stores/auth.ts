import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getMe } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isOperation = computed(() => userRole.value === 'operation')
  const isCustomerService = computed(() => userRole.value === 'customer_service')
  const isEngineering = computed(() => userRole.value === 'engineering')

  async function login(username: string, password: string) {
    const res: any = await apiLogin(username, password)
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    await fetchUser()
  }

  async function fetchUser() {
    try {
      user.value = await getMe()
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function init() {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        logout()
      }
    }
  }

  init()

  return {
    token, user, isLoggedIn, userRole, userName,
    isAdmin, isOperation, isCustomerService, isEngineering,
    login, fetchUser, logout
  }
})
