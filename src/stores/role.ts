import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

export const useRoleStore = defineStore('role', () => {
  const currentRole = ref<UserRole>('sales_clerk')

  const roleLabel = computed(() => ROLE_LABELS[currentRole.value])

  const roles: { value: UserRole; label: string }[] = [
    { value: 'sales_clerk', label: ROLE_LABELS.sales_clerk },
    { value: 'warehouse', label: ROLE_LABELS.warehouse },
    { value: 'after_sales', label: ROLE_LABELS.after_sales },
  ]

  function switchRole(role: UserRole) {
    currentRole.value = role
  }

  return { currentRole, roleLabel, roles, switchRole }
})
