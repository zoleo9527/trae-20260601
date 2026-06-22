import { ref, computed } from 'vue'
import type { GasRole } from '@/types/gas'

const currentRole = ref<GasRole | null>(null)
const currentRoleName = ref<string>('')

const roleConfig: Record<GasRole, { name: string; icon: string }> = {
  safety_inspector: { name: '安检员', icon: 'ShieldCheck' },
  customer_service: { name: '客服', icon: 'Headphones' },
  repair_technician: { name: '维修师傅', icon: 'Wrench' },
}

export function useRole() {
  const setRole = async (role: GasRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const data = await res.json()
      if (data.success && data.data) {
        currentRole.value = data.data.role
        currentRoleName.value = data.data.name
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
      const res = await fetch('/api/role', { method: 'GET' })
      const data = await res.json()
      if (data.success && data.data) {
        currentRole.value = data.data.role
        currentRoleName.value = data.data.name
        return data.data
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

  const isSafetyInspector = computed(() => currentRole.value === 'safety_inspector')
  const isCustomerService = computed(() => currentRole.value === 'customer_service')
  const isRepairTechnician = computed(() => currentRole.value === 'repair_technician')

  return {
    currentRole,
    roleName,
    roleIcon,
    setRole,
    clearRole,
    fetchRole,
    isSafetyInspector,
    isCustomerService,
    isRepairTechnician,
  }
}
