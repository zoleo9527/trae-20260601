import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  const roleLabels: Record<UserRole, string> = {
    sales: '宴会销售',
    hall: '厅面主管',
    kitchen: '后厨统筹',
  }

  const roleDescriptions: Record<UserRole, string> = {
    sales: '创建活动订单、发起尾款核对、查看全量反馈',
    hall: '确认现场执行、填写服务反馈、接收待办提醒',
    kitchen: '确认菜单执行、填写出品反馈、接收待办提醒',
  }

  const isLoggedIn = computed(() => user.value !== null)
  const roleLabel = computed(() => user.value ? roleLabels[user.value.role] : '')

  function login(role: UserRole, name: string) {
    user.value = { role, name }
    localStorage.setItem('banquet_user', JSON.stringify({ role, name }))
  }

  function logout() {
    user.value = null
    localStorage.removeItem('banquet_user')
  }

  function restoreFromStorage() {
    const stored = localStorage.getItem('banquet_user')
    if (stored) {
      try {
        user.value = JSON.parse(stored)
      } catch {
        user.value = null
      }
    }
  }

  return {
    user,
    roleLabels,
    roleDescriptions,
    isLoggedIn,
    roleLabel,
    login,
    logout,
    restoreFromStorage,
  }
})
