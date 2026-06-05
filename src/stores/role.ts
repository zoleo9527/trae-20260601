import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type RoleId = 'rental' | 'coach_supervisor' | 'safety_patrol'

interface RoleInfo {
  id: RoleId
  name: string
  description: string
}

const ROLES: Record<RoleId, RoleInfo> = {
  rental: { id: 'rental', name: '租赁员', description: '雪具租赁/归还、查看租赁状态、标记异常' },
  coach_supervisor: { id: 'coach_supervisor', name: '教练主管', description: '教练排班、课程创建/取消、查看学员签到状态、处理爽约' },
  safety_patrol: { id: 'safety_patrol', name: '安全巡逻员', description: '创建救援记录、上传附件证据、查看救援历史' },
}

export const useRoleStore = defineStore('role', () => {
  const currentRole = ref<RoleId>('rental')

  const roleName = computed(() => ROLES[currentRole.value].name)
  const roleDescription = computed(() => ROLES[currentRole.value].description)
  const allRoles = computed(() => Object.values(ROLES))

  function switchRole(roleId: RoleId) {
    currentRole.value = roleId
  }

  return { currentRole, roleName, roleDescription, allRoles, switchRole }
})
