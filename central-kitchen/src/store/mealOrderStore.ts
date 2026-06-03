import { create } from 'zustand'
import type {
  MealOrder,
  MealOrderStatus,
  ShortageStatus,
  MealItem,
  ShortageMaterial,
  StatusLog,
} from '@/types'
import { MOCK_MEAL_ORDERS } from '@/data/mockData'
import {
  MEAL_ORDER_TRANSITIONS,
  SHORTAGE_TRANSITIONS,
} from '@/constants/statusMachine'
import { useAuthStore } from './authStore'

interface MealOrderState {
  orders: MealOrder[]
  selectedOrderId: string | null
  isLoading: boolean

  fetchOrders: () => void
  getOrder: (id: string) => MealOrder | undefined
  getSelectedOrder: () => MealOrder | undefined
  setSelectedOrder: (id: string | null) => void

  createOrder: (order: Omit<MealOrder, 'id'>) => void
  updateOrder: (id: string, updates: Partial<MealOrder>) => void
  deleteOrder: (id: string) => void

  transitionStatus: (
    orderId: string,
    toStatus: MealOrderStatus,
    remark: string
  ) => void

  createShortageReplenish: (
    orderId: string,
    data: {
      items: MealItem[]
      remarks: string
      previousConclusion: string
      materials: ShortageMaterial[]
    }
  ) => void

  transitionShortageStatus: (
    orderId: string,
    toStatus: ShortageStatus,
    remark: string
  ) => void

  addShortageMaterial: (
    orderId: string,
    material: ShortageMaterial
  ) => void

  updateShortageRemark: (
    orderId: string,
    field: 'supplyRemark' | 'replenishRemark' | 'supervisorRemark',
    value: string
  ) => void

  batchUpdateItems: (
    orderId: string,
    items: MealItem[]
  ) => void

  getOrdersByStatus: (status: MealOrderStatus) => MealOrder[]
  getShortageOrders: () => MealOrder[]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function createStatusLog(
  status: MealOrderStatus | ShortageStatus,
  remark: string
): StatusLog {
  const user = useAuthStore.getState().currentUser
  return {
    id: generateId(),
    status,
    operator: user?.name || '系统',
    operatorRole: user?.role || 'store_supervisor',
    timestamp: new Date().toISOString(),
    remark,
  }
}

export const useMealOrderStore = create<MealOrderState>((set, get) => ({
  orders: MOCK_MEAL_ORDERS,
  selectedOrderId: null,
  isLoading: false,

  fetchOrders: () => {
    set({ isLoading: true })
    setTimeout(() => {
      set({ orders: MOCK_MEAL_ORDERS, isLoading: false })
    }, 300)
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  getSelectedOrder: () => {
    const { orders, selectedOrderId } = get()
    return orders.find((o) => o.id === selectedOrderId)
  },

  setSelectedOrder: (id) => set({ selectedOrderId: id }),

  createOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, { ...order, id: generateId() }],
    })),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
    o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
  ),
  })),

  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
  })),

  transitionStatus: (orderId, toStatus, remark) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId)
      if (!order) return state

      const transition = MEAL_ORDER_TRANSITIONS.find(
        (t) => t.from === order.status && t.to === toStatus
      )
      if (!transition) return state

      const newLog = createStatusLog(toStatus, remark)

      let updates: Partial<MealOrder> = {
        status: toStatus,
        statusLogs: [...order.statusLogs, newLog],
      }

      if (transition.remarkLabel === '生产备注' || transition.remarkLabel === '驳回原因') {
        updates.productionRemark = remark
      } else if (transition.remarkLabel === '配送备注') {
        updates.deliveryRemark = remark
      } else if (transition.remarkLabel === '修改说明') {
        updates.productionRemark = remark
      }

      return {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? { ...o, ...updates, updatedAt: new Date().toISOString() }
            : o
        ),
      }
    }),

  createShortageReplenish: (orderId, data) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId)
      if (!order) return state

      const newShortage = {
        id: generateId(),
        orderId,
        mealOrderId: orderId,
        items: data.items,
        status: 'pending_review' as ShortageStatus,
        previousConclusion: data.previousConclusion,
        materials: data.materials,
        remarks: data.remarks,
        statusLogs: [createStatusLog('pending_review', '创建缺货补发单')],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'shortage_reported',
                shortageReplenish: newShortage,
                statusLogs: [
                  ...o.statusLogs,
                  createStatusLog('shortage_reported', data.remarks),
                ],
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      }
    }),

  transitionShortageStatus: (orderId, toStatus, remark) =>
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId)
      if (!order || !order.shortageReplenish) return state

      const shortage = order.shortageReplenish
      const transition = SHORTAGE_TRANSITIONS.find(
        (t) => t.from === shortage.status && t.to === toStatus
      )
      if (!transition) return state

      const newLog = createStatusLog(toStatus, remark)

      const updatedShortage = {
        ...shortage,
        status: toStatus,
        statusLogs: [...shortage.statusLogs, newLog],
        updatedAt: new Date().toISOString(),
      }

      if (transition.remarkLabel === '采购备注' || transition.remarkLabel === '驳回原因（需补充材料）') {
        updatedShortage.supplyRemark = remark
      } else if (transition.remarkLabel === '补发详情' || transition.remarkLabel === '补发安排') {
        updatedShortage.replenishRemark = remark
      } else if (transition.remarkLabel === '复核意见' || transition.remarkLabel === '不通过原因') {
        updatedShortage.supervisorRemark = remark
      } else if (transition.remarkLabel === '补充说明') {
        updatedShortage.remarks = remark
      }

      return {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                shortageReplenish: updatedShortage,
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      }
    }),

  addShortageMaterial: (orderId, material) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && o.shortageReplenish
          ? {
              ...o,
              shortageReplenish: {
                ...o.shortageReplenish,
                materials: [...o.shortageReplenish.materials, material],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    })),

  updateShortageRemark: (orderId, field, value) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId && o.shortageReplenish
          ? {
              ...o,
              shortageReplenish: {
                ...o.shortageReplenish,
                [field]: value,
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    })),

  batchUpdateItems: (orderId, items) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items,
              totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    })),

  getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),

  getShortageOrders: () =>
    get().orders.filter((o) => o.shortageReplenish !== undefined),
}))
