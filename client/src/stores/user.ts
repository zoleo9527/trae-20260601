import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)

  async function fetchCurrentUser() {
    try {
      const data = await userApi.getCurrent()
      currentUser.value = data
      return data
    } catch (e) {
      console.error('获取当前用户失败:', e)
      throw e
    }
  }

  async function switchRole(role: User['role']) {
    const user = await userApi.switchRole(role)
    currentUser.value = user
    return user
  }

  return {
    currentUser,
    fetchCurrentUser,
    switchRole
  }
})
