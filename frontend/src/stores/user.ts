import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '../types'
import { mockUsers } from '../mock'

const STORAGE_KEY = 'pinia_user_store'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])

  function saveToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentUser: currentUser.value,
        users: users.value,
      })
    )
  }

  function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        currentUser.value = parsed.currentUser
        users.value = parsed.users
        return true
      } catch {
        return false
      }
    }
    return false
  }

  function initUser() {
    if (!loadFromStorage()) {
      users.value = [...mockUsers]
      currentUser.value = mockUsers[0]
      saveToStorage()
    }
  }

  function setRole(role: UserRole) {
    if (currentUser.value) {
      currentUser.value.role = role
      saveToStorage()
    }
  }

  function switchUser(userId: string) {
    const user = users.value.find((u) => u.id === userId)
    if (user) {
      currentUser.value = user
      saveToStorage()
    }
  }

  const isTechnician = computed(() => currentUser.value?.role === 'technician')
  const isCustomerService = computed(() => currentUser.value?.role === 'customer_service')
  const isSupervisor = computed(() => currentUser.value?.role === 'supervisor')

  const todoCount = computed(() => {
    const replacementsStr = localStorage.getItem('pinia_replacements_store')
    if (!replacementsStr) return 0

    try {
      const { replacements } = JSON.parse(replacementsStr)
      const role = currentUser.value?.role

      if (role === 'technician') {
        return replacements.filter(
          (r: { status: string; technicianId: string }) =>
            (r.status === 'draft' || r.status === 'rejected') &&
            r.technicianId === currentUser.value?.id
        ).length
      }

      if (role === 'customer_service') {
        return replacements.filter(
          (r: { status: string }) => r.status === 'pending_confirm' || r.status === 'resubmitted'
        ).length
      }

      if (role === 'supervisor') {
        return replacements.filter((r: { status: string }) => r.status === 'confirmed').length
      }

      return 0
    } catch {
      return 0
    }
  })

  return {
    currentUser,
    users,
    setRole,
    switchUser,
    initUser,
    isTechnician,
    isCustomerService,
    isSupervisor,
    todoCount,
  }
})
