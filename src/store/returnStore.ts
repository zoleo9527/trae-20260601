import { create } from 'zustand'
import { useAuthStore } from './authStore'

type UserRole = '客服' | '派件员' | '驿站负责人'
type ReturnStatus = '待派件员确认' | '待驿站认定' | '退回处理完成' | '已驳回-待补录' | '已驳回-待客服补录' | '复盘进行中' | '复盘完成'

interface ReturnItem {
  id: number
  trackingNo: string
  reason: string
  status: ReturnStatus
  createdBy: number
  createdByName: string | null
  assignedTo: number | null
  assignedToName: string | null
  createdAt: string
  updatedAt: string
}

interface ReturnLog {
  id: number
  returnId: number
  fromStatus: ReturnStatus | null
  toStatus: ReturnStatus
  operatorId: number
  operatorRole: UserRole
  operatorName: string
  action: string
  remark: string | null
  createdAt: string
}

interface ReviewRecord {
  id: number
  returnId: number
  conclusion: string
  improvement: string | null
  operatorId: number
  operatorRole: UserRole
  operatorName: string
  createdAt: string
}

interface ReturnItemDetail extends ReturnItem {
  logs: ReturnLog[]
  reviews: ReviewRecord[]
  createdByName: string | null
  assignedToName: string | null
}

interface ReturnFilters {
  status: string
  keyword: string
}

interface ReturnState {
  returns: ReturnItem[]
  currentReturn: ReturnItemDetail | null
  pagination: { page: number; pageSize: number; total: number }
  filters: ReturnFilters
  loading: boolean
  fetchReturns: () => Promise<void>
  fetchReturnDetail: (id: number) => Promise<void>
  createReturn: (data: { trackingNo: string; reason: string; remark?: string }) => Promise<void>
  processReturn: (id: number, action: string, remark?: string) => Promise<void>
  createReview: (id: number, data: { conclusion: string; improvement?: string }) => Promise<void>
  setFilters: (filters: Partial<ReturnFilters>) => void
  setPage: (page: number) => void
}

const getHeaders = () => {
  const token = useAuthStore.getState().token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const useReturnStore = create<ReturnState>()((set, get) => ({
  returns: [],
  currentReturn: null,
  pagination: { page: 1, pageSize: 20, total: 0 },
  filters: { status: '', keyword: '' },
  loading: false,

  fetchReturns: async () => {
    set({ loading: true })
    try {
      const { pagination, filters } = get()
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      })
      if (filters.status) params.set('status', filters.status)
      if (filters.keyword) params.set('keyword', filters.keyword)

      const res = await fetch(`/api/returns?${params}`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error('获取退回件列表失败')
      const json = await res.json()
      set({
        returns: json.data.list,
        pagination: { ...pagination, total: json.data.total },
      })
    } catch (e) {
      console.error(e)
    } finally {
      set({ loading: false })
    }
  },

  fetchReturnDetail: async (id: number) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/returns/${id}`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error('获取退回件详情失败')
      const json = await res.json()
      set({ currentReturn: json.data })
    } catch (e) {
      console.error(e)
    } finally {
      set({ loading: false })
    }
  },

  createReturn: async (data) => {
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '创建退回件失败')
    }
    await get().fetchReturns()
  },

  processReturn: async (id, action, remark) => {
    const res = await fetch(`/api/returns/${id}/process`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action, remark }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '操作失败')
    }
    const json = await res.json()
    set({ currentReturn: json.data })
  },

  createReview: async (id, data) => {
    const res = await fetch(`/api/returns/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '复盘提交失败')
    }
    const json = await res.json()
    set({ currentReturn: json.data })
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }))
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }))
  },
}))

export type { ReturnItem, ReturnItemDetail, ReturnLog, ReviewRecord, ReturnStatus, UserRole }
