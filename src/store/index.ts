import type { MaintenanceOrder, Role, RoleInfo } from '@/types'
import { create } from 'zustand'

interface AppStore {
  currentRole: Role
  setCurrentRole: (role: Role) => void
  roles: RoleInfo[]
  setRoles: (roles: RoleInfo[]) => void
  orders: MaintenanceOrder[]
  setOrders: (orders: MaintenanceOrder[]) => void
  selectedIds: string[]
  toggleSelect: (id: string) => void
  clearSelection: () => void
  selectAll: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void
}

export const useStore = create<AppStore>((set) => ({
  currentRole: 'technician',
  setCurrentRole: (role) => set({ currentRole: role }),
  roles: [
    { key: 'technician', label: '维保技师', description: '查看待执行计划、到场签到、提交维保记录' },
    { key: 'service', label: '客服', description: '查看签到状态、跟进异常工单、添加备注' },
    { key: 'supervisor', label: '项目主管', description: '审核维保完成记录、批量处理、查看统计' },
  ],
  setRoles: (roles) => set({ roles }),
  orders: [],
  setOrders: (orders) => set({ orders }),
  selectedIds: [],
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: (ids) => set({ selectedIds: ids }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
}))
