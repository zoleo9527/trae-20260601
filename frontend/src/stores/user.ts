import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface User {
  id: number
  name: string
  phone: string
  role: 'DISPATCHER' | 'INSTALLER' | 'SERVICE'
  created_at: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => user.value !== null)
  const roleDisplayName = computed(() => {
    if (!user.value) return ''
    const roleMap = {
      'DISPATCHER': '调度员',
      'INSTALLER': '安装师傅',
      'SERVICE': '售后客服'
    }
    return roleMap[user.value.role]
  })

  async function login(phone: string) {
    try {
      const response = await api.get<{ id: number; name: string; phone: string; role: string; created_at: string }[]>(`/users?role=DISPATCHER`)
      const allUsers = await api.get<{ id: number; name: string; phone: string; role: string; created_at: string }[]>(`/users`)
      
      const foundUser = allUsers.find(u => u.phone === phone)
      if (foundUser) {
        user.value = {
          id: foundUser.id,
          name: foundUser.name,
          phone: foundUser.phone,
          role: foundUser.role as 'DISPATCHER' | 'INSTALLER' | 'SERVICE',
          created_at: foundUser.created_at
        }
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('token', 'mock-token')
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  function initUser() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    roleDisplayName,
    login,
    logout,
    initUser
  }
})