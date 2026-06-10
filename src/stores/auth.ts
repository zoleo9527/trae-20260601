import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const role = ref<string | null>(localStorage.getItem('auth_role'))
  const name = ref<string | null>(localStorage.getItem('auth_name'))

  const isLoggedIn = computed(() => !!role.value && !!name.value)

  function login(userRole: string, userName: string) {
    role.value = userRole
    name.value = userName
    localStorage.setItem('auth_role', userRole)
    localStorage.setItem('auth_name', userName)
  }

  function logout() {
    role.value = null
    name.value = null
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_name')
  }

  return { role, name, isLoggedIn, login, logout }
})
