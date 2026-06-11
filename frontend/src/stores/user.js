import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const isStoreManager = computed(() => userRole.value === 'store_manager')
  const isSupervisor = computed(() => userRole.value === 'operation_supervisor')
  const isOperationSupervisor = computed(() => userRole.value === 'operation_supervisor')
  const isManager = computed(() => userRole.value === 'investment_manager')
  const isInvestmentManager = computed(() => userRole.value === 'investment_manager')

  async function login(username, password) {
    const res = await authApi.login({ username, password })
    token.value = res.access_token
    userInfo.value = res.user
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchUserInfo() {
    if (token.value) {
      try {
        const res = await authApi.getCurrentUser()
        userInfo.value = res
        localStorage.setItem('user', JSON.stringify(res))
      } catch (e) {
        console.error('Fetch user info error:', e)
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    isStoreManager,
    isSupervisor,
    isOperationSupervisor,
    isManager,
    isInvestmentManager,
    login,
    logout,
    fetchUserInfo
  }
})
