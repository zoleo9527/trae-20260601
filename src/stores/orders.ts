import { create } from 'zustand'
import type { Order, OrderStatus } from '../shared/types'
import { useAuthStore } from './auth'

type OrderFilterStatus = OrderStatus | 'ABNORMAL'

interface OrderFilters {
  status?: OrderFilterStatus
  search?: string
  page?: number
  limit?: number
}

interface OrdersState {
  orders: Order[]
  currentOrder: Order | null
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  filters: OrderFilters
  fetchOrders: (filters?: OrderFilters) => Promise<void>
  fetchOrder: (id: string) => Promise<void>
  createOrder: (data: Partial<Order>) => Promise<Order>
  transitionStatus: (id: string, action: string, reason?: string) => Promise<void>
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
  filters: {},

  fetchOrders: async (filters?: OrderFilters) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        set({ isLoading: false })
        return
      }
      const currentFilters = { ...get().filters, ...filters }
      
      const params = new URLSearchParams()
      if (currentFilters.status) params.append('status', currentFilters.status)
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.page) params.append('page', currentFilters.page.toString())
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString())

      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      set({
        orders: data.data || [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        filters: currentFilters,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  fetchOrder: async (id: string) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const order = await response.json()
      set({ currentOrder: order, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  createOrder: async (data: Partial<Order>) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const newOrder = await response.json()
      set((state) => ({
        orders: [...state.orders, newOrder],
        isLoading: false,
      }))
      return newOrder
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  transitionStatus: async (id: string, action: string, reason?: string) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || '操作失败，请重试')
      }

      const updatedOrder = await response.json()
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
