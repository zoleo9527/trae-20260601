import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Staff, RoleType } from '@/types'
import { useOrderStore } from '@/stores/order'

const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: '周小燕',
    role: 'cs',
    avatar: '',
    processingCount: 3,
    isOnline: true,
  },
  {
    id: 'staff-2',
    name: '钱伟明',
    role: 'cs',
    avatar: '',
    processingCount: 2,
    isOnline: true,
  },
  {
    id: 'staff-3',
    name: '孙艺涵',
    role: 'designer',
    avatar: '',
    processingCount: 4,
    isOnline: true,
  },
  {
    id: 'staff-4',
    name: '李思远',
    role: 'designer',
    avatar: '',
    processingCount: 2,
    isOnline: false,
  },
  {
    id: 'staff-5',
    name: '陈志强',
    role: 'qc',
    avatar: '',
    processingCount: 3,
    isOnline: true,
  },
  {
    id: 'staff-6',
    name: '王美华',
    role: 'qc',
    avatar: '',
    processingCount: 2,
    isOnline: true,
  },
]

export const useStaffStore = defineStore('staff', () => {
  const staffList = ref<Staff[]>([...mockStaff])
  const currentRole = ref<RoleType>('qc')
  const currentStaffId = ref('staff-5')

  function getStaffById(id: string): Staff | undefined {
    return staffList.value.find((s) => s.id === id)
  }

  const activeStatuses = new Set([
    'pending_design',
    'designing',
    'pending_qc',
    'qc_in_progress',
    'passed',
    'pending_shipping',
  ])

  function getStaffByRole(role: RoleType): Staff[] {
    const orderStore = useOrderStore()
    return staffList.value
      .filter((s) => s.role === role)
      .map((s) => {
        const count = orderStore.orders.filter((o) => {
          if (!activeStatuses.has(o.status)) return false
          if (role === 'cs') return o.assignedCs === s.id
          if (role === 'designer') return o.assignedDesigner === s.id
          if (role === 'qc') return o.assignedQc === s.id
          return false
        }).length
        return { ...s, processingCount: count }
      })
  }

  function getOnlineStaffByRole(role: RoleType): Staff[] {
    return staffList.value.filter((s) => s.role === role && s.isOnline)
  }

  function switchRole(role: RoleType) {
    currentRole.value = role
    const staff = staffList.value.find((s) => s.role === role && s.isOnline)
    if (staff) {
      currentStaffId.value = staff.id
    }
  }

  return {
    staffList,
    currentRole,
    currentStaffId,
    getStaffById,
    getStaffByRole,
    getOnlineStaffByRole,
    switchRole,
  }
})
