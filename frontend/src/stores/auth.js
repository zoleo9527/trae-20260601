import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('access_token'))

  const isLoggedIn = computed(() => !!accessToken.value)

  const roleMap = {
    social_worker: '站点社工',
    volunteer_leader: '志愿队长',
    community_official: '社区干部',
    volunteer: '志愿者'
  }

  const roleText = computed(() => user.value ? roleMap[user.value.role] : '')

  async function login(username, password) {
    const response = await authAPI.login({ username, password })
    user.value = response.data.user
    accessToken.value = response.data.access_token
    localStorage.setItem('access_token', accessToken.value)
    return response.data
  }

  function logout() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('access_token')
  }

  function setUser(userData) {
    user.value = userData
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    roleText,
    login,
    logout,
    setUser
  }
})