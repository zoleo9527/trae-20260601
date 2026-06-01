import { mockOrders } from '@/data/mockOrders'
import type { MealType, Order, RefundReason, SubsidyType, ViewMode } from '@/types'
import { create } from 'zustand'

interface OrderStore {
  orders: Order[]
  viewMode: ViewMode
  selectedOrderIds: Set<string>
  activeOrderId: string | null
  showAddMealModal: boolean
  showRefundModal: boolean
  refundTargetId: string | null
  searchQuery: string

  setViewMode: (mode: ViewMode) => void
  toggleSelectOrder: (id: string) => void
  selectAllOrders: () => void
  clearSelection: () => void
  setActiveOrder: (id: string | null) => void
  batchVerify: () => void
  addTemporaryMeal: (data: {
    elderName: string
    mealType: MealType
    dishName: string
    subsidyType: SubsidyType
    deliveryAddress: string
    note: string
    phone: string
  }) => void
  requestRefund: (orderId: string, reason: RefundReason) => void
  cancelRefund: (orderId: string) => void
  setShowAddMealModal: (show: boolean) => void
  setShowRefundModal: (show: boolean, orderId?: string) => void
  setSearchQuery: (query: string) => void
  getFilteredOrders: () => Order[]
  getAbnormalOrders: () => Order[]
  getTodayOrders: () => Order[]
  getTomorrowOrders: () => Order[]
}

function getDateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [...mockOrders],
  viewMode: 'today',
  selectedOrderIds: new Set<string>(),
  activeOrderId: null,
  showAddMealModal: false,
  showRefundModal: false,
  refundTargetId: null,
  searchQuery: '',

  setViewMode: (mode) => set({ viewMode: mode, selectedOrderIds: new Set(), activeOrderId: null }),

  toggleSelectOrder: (id) =>
    set((state) => {
      const next = new Set(state.selectedOrderIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedOrderIds: next }
    }),

  selectAllOrders: () =>
    set(() => {
      const filtered = get().getFilteredOrders()
      const selectable = filtered
        .filter((o) => o.status === 'served' || o.status === 'pending')
        .map((o) => o.id)
      return { selectedOrderIds: new Set(selectable) }
    }),

  clearSelection: () => set({ selectedOrderIds: new Set() }),

  setActiveOrder: (id) => set({ activeOrderId: id }),

  batchVerify: () =>
    set((state) => {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      const updated = state.orders.map((o) =>
        state.selectedOrderIds.has(o.id) && (o.status === 'served' || o.status === 'pending')
          ? { ...o, status: 'verified' as const, verifiedAt: now }
          : o
      )
      return { orders: updated, selectedOrderIds: new Set() }
    }),

  addTemporaryMeal: (data) =>
    set((state) => {
      const newOrder: Order = {
        id: `TMP-${Date.now()}`,
        elderName: data.elderName,
        mealType: data.mealType,
        dishName: data.dishName,
        subsidyType: data.subsidyType,
        subsidyExpired: false,
        deliveryAddress: data.deliveryAddress,
        status: 'pending',
        orderDate: getDateStr(0),
        isTemporary: true,
        note: data.note,
        duplicateOrder: false,
        verifiedAt: null,
        refundReason: null,
        isServedRefund: false,
        phone: data.phone,
      }
      return { orders: [newOrder, ...state.orders], showAddMealModal: false }
    }),

  requestRefund: (orderId, reason) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId)
      if (!order) return state
      const isServedRefund = order.status === 'served' || order.status === 'verified'
      const updated = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'refund_requested' as const,
              refundReason: reason,
              isServedRefund,
            }
          : o
      )
      return { orders: updated, showRefundModal: false, refundTargetId: null }
    }),

  cancelRefund: (orderId) =>
    set((state) => {
      const updated = state.orders.map((o) =>
        o.id === orderId && o.status === 'refund_requested'
          ? { ...o, status: 'pending' as const, refundReason: null, isServedRefund: false }
          : o
      )
      return { orders: updated }
    }),

  setShowAddMealModal: (show) => set({ showAddMealModal: show }),

  setShowRefundModal: (show, orderId) =>
    set({ showRefundModal: show, refundTargetId: orderId ?? null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getTodayOrders: () => {
    const today = getDateStr(0)
    return get().orders.filter((o) => o.orderDate === today)
  },

  getTomorrowOrders: () => {
    const tomorrow = getDateStr(1)
    return get().orders.filter((o) => o.orderDate === tomorrow)
  },

  getAbnormalOrders: () => {
    return get().orders.filter(
      (o) =>
        o.subsidyExpired ||
        o.duplicateOrder ||
        o.status === 'refund_requested'
    )
  },

  getFilteredOrders: () => {
    const state = get()
    let orders: Order[]
    switch (state.viewMode) {
      case 'today':
        orders = state.getTodayOrders()
        break
      case 'tomorrow':
        orders = state.getTomorrowOrders()
        break
      case 'abnormal':
        orders = state.getAbnormalOrders()
        break
      default:
        orders = state.getTodayOrders()
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase()
      orders = orders.filter(
        (o) =>
          o.elderName.toLowerCase().includes(q) ||
          o.deliveryAddress.toLowerCase().includes(q) ||
          o.dishName.toLowerCase().includes(q)
      )
    }
    return orders
  },
}))
