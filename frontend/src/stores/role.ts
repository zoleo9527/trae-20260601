import { reactive, computed } from 'vue'
import type { Role, RoleKey } from '@/types'
import { ROLES } from '@/types'

interface RoleState {
  currentRoleKey: RoleKey
}

const state = reactive<RoleState>({
  currentRoleKey: 'manager'
})

export function useRoleStore() {
  const currentRole = computed<Role>(() => {
    return ROLES.find(r => r.key === state.currentRoleKey) || ROLES[0]
  })

  const currentUser = computed(() => currentRole.value.user)

  function setRole(key: RoleKey) {
    state.currentRoleKey = key
  }

  function canHandle(requiredRole: RoleKey): boolean {
    return state.currentRoleKey === requiredRole
  }

  return {
    state,
    currentRole,
    currentUser,
    setRole,
    canHandle
  }
}
