import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Staff, RoleType } from '@/types'

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

  function getStaffByRole(role: RoleType): Staff[] {
    return staffList.value.filter((s) => s.role === role)
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
