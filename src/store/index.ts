import { create } from 'zustand'
import { apiGet, apiPost } from '@/lib/api'
import type { Role, Session } from '@/types'

interface RoleConfig {
  label: string
  icon: string
  description: string
  entries: string[]
  canCreateQualification?: boolean
  canCreatePurchase?: boolean
  canConfirmOut?: boolean
  canShip?: boolean
  canComplete?: boolean
  canReviewQualification?: boolean
  canApprovePurchase?: boolean
}

export const roleConfig: Record<Role, RoleConfig> = {
  sales_clerk: {
    label: '销售内勤',
    icon: 'ClipboardList',
    description: '负责客户资质管理与采购申请创建',
    entries: ['qualifications', 'purchases'],
    canCreateQualification: true,
    canCreatePurchase: true,
  },
  warehouse: {
    label: '仓库员',
    icon: 'Warehouse',
    description: '负责采购单出库确认',
    entries: ['purchases'],
    canConfirmOut: true,
    canShip: true,
  },
  after_sales: {
    label: '售后专员',
    icon: 'Headphones',
    description: '负责发货与签收确认',
    entries: ['purchases'],
    canShip: true,
    canComplete: true,
  },
  director: {
    label: '主管',
    icon: 'Crown',
    description: '负责资质审核与采购审批，查看总览看板',
    entries: ['dashboard', 'qualifications', 'purchases'],
    canReviewQualification: true,
    canApprovePurchase: true,
  },
}

interface StoreState {
  session: Session | null
  setSession: (session: Session | null) => void
  fetchSession: () => Promise<void>
  switchRole: (role: Role) => Promise<void>
}

export const useStore = create<StoreState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  fetchSession: async () => {
    try {
      const data = await apiGet<Session>('/session')
      set({ session: data })
    } catch {
      set({ session: null })
    }
  },
  switchRole: async (role: Role) => {
    const data = await apiPost<Session>('/session', { role })
    set({ session: data })
  },
}))
