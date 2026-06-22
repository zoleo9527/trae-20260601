import { ref, computed } from 'vue'
import type { Role } from '@/types'
import { setRole as setRoleApi, getRole as getRoleApi } from '@/api'

const currentRole = ref<Role | null>(null)
const currentRoleName = ref<string>('')

const roleConfig: Record<Role, { name: string; icon: string }> = {
  pm: { name: '项目经理', icon: 'Briefcase' },
  captain: { name: '施工队长', icon: 'HardHat' },
  engineer: { name: '售后工程师', icon: 'Wrench' },
}

export function useRole() {
  const setRole = async (role: Role): Promise<boolean> => {
    try {
      const res = await setRoleApi(role)
      if (res.success && res.data) {
        currentRole.value = res.data.role
        currentRoleName.value = res.data.name
        return true
      }
    } catch (err) {
      console.error('设置角色失败:', err)
    }
    currentRole.value = role
    currentRoleName.value = roleConfig[role].name
    return true
  }

  const fetchRole = async () => {
    try {
      const res = await getRoleApi()
      if (res.success && res.data) {
        currentRole.value = res.data.role
        currentRoleName.value = res.data.name
        return res.data
      }
    } catch (err) {
      console.error('获取角色失败:', err)
    }
    return null
  }

  const clearRole = () => {
    currentRole.value = null
    currentRoleName.value = ''
  }

  const roleName = computed(() => {
    return currentRoleName.value || (currentRole.value ? roleConfig[currentRole.value].name : '')
  })

  const roleIcon = computed(() => {
    return currentRole.value ? roleConfig[currentRole.value].icon : ''
  })

  const isPM = computed(() => currentRole.value === 'pm')
  const isCaptain = computed(() => currentRole.value === 'captain')
  const isEngineer = computed(() => currentRole.value === 'engineer')

  return {
    currentRole,
    roleName,
    roleIcon,
    setRole,
    clearRole,
    fetchRole,
    isPM,
    isCaptain,
    isEngineer,
  }
}
