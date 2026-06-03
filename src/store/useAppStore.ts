import { create } from 'zustand'
import type { HandlerRole, OrderFilter, Order, HandoffAction, HandoffDetails, Stage } from '@/types'
import { fetchOrders, fetchOrderDetail, submitHandoff as apiSubmitHandoff } from '@/utils/api'

interface AppState {
  currentRole: HandlerRole
  filters: OrderFilter
  selectedOrderId: string | null
  showHandoffPanel: boolean
  showProductionBoard: boolean
  orders: Order[]
  currentOrder: Order | null
  loading: boolean
  error: string | null

  setRole: (role: HandlerRole) => void
  setFilter: (filters: Partial<OrderFilter>) => void
  resetFilters: () => void
  selectOrder: (id: string | null) => void
  toggleHandoffPanel: () => void
  toggleProductionBoard: () => void
  fetchOrdersList: (filters?: OrderFilter) => Promise<void>
  fetchOrderDetailAction: (id: string) => Promise<void>
  submitHandoffAction: (
    orderId: string,
    data: { action: HandoffAction; reason: string; details?: Partial<HandoffDetails> }
  ) => Promise<void>
}

const stageToNextHandler: Record<Stage, { submit: { toRole: HandlerRole; nextStage: Stage }; reject?: { toRole: HandlerRole; nextStage: Stage } }> = {
  reception: { submit: { toRole: 'designer', nextStage: 'design' } },
  design: { submit: { toRole: 'inspector', nextStage: 'qc' }, reject: { toRole: 'receptionist', nextStage: 'reception' } },
  qc: { submit: { toRole: 'inspector', nextStage: 'production' }, reject: { toRole: 'designer', nextStage: 'design' } },
  production: { submit: { toRole: 'inspector', nextStage: 'production' } },
}

const handlerToRole: Record<string, HandlerRole> = {
  receptionist: 'receptionist',
  designer: 'designer',
  inspector: 'inspector',
}

const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'receptionist',
  filters: {},
  selectedOrderId: null,
  showHandoffPanel: false,
  showProductionBoard: false,
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  setRole: (role) => {
    set({ currentRole: role })
    const params = new URLSearchParams(window.location.search)
    params.set('role', role)
    window.history.replaceState(null, '', `?${params.toString()}`)
  },

  setFilter: (newFilters) => {
    const merged = { ...get().filters, ...newFilters }
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== '')
    ) as OrderFilter
    set({ filters: cleaned })
    const params = new URLSearchParams(window.location.search)
    params.set('role', get().currentRole)
    Object.entries(cleaned).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    window.history.replaceState(null, '', `?${params.toString()}`)
  },

  resetFilters: () => {
    set({ filters: {} })
    const params = new URLSearchParams(window.location.search)
    params.set('role', get().currentRole)
    window.history.replaceState(null, '', `?${params.toString()}`)
  },

  selectOrder: (id) => {
    set({ selectedOrderId: id, showHandoffPanel: id !== null })
  },

  toggleHandoffPanel: () => {
    const next = !get().showHandoffPanel
    set({ showHandoffPanel: next })
    if (!next) set({ selectedOrderId: null })
  },

  toggleProductionBoard: () => {
    set((s) => ({ showProductionBoard: !s.showProductionBoard }))
  },

  fetchOrdersList: async (filters?: OrderFilter) => {
    set({ loading: true, error: null })
    try {
      const queryFilters = filters ?? get().filters
      const orders = await fetchOrders(queryFilters)
      set({ orders, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchOrderDetailAction: async (id) => {
    set({ loading: true, error: null })
    try {
      const order = await fetchOrderDetail(id)
      set({ currentOrder: order, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  submitHandoffAction: async (orderId, data) => {
    set({ loading: true, error: null })
    try {
      const order = get().orders.find(o => o.id === orderId)
      const currentRole = get().currentRole
      const fromRole = handlerToRole[order?.currentHandler ?? currentRole] ?? currentRole
      const stageConfig = stageToNextHandler[order?.currentStage ?? 'reception']
      const toRole = data.action === 'reject'
        ? (stageConfig?.reject?.toRole ?? 'designer')
        : (stageConfig?.submit?.toRole ?? 'designer')

      await apiSubmitHandoff(orderId, {
        fromRole,
        toRole,
        action: data.action,
        reason: data.reason,
        details: data.details,
      })
      await get().fetchOrdersList()
      set({ loading: false, showHandoffPanel: false, selectedOrderId: null })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
}))

export default useAppStore
