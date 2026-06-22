import { create } from 'zustand'
import type {
  Inventory,
  Customer,
  PriceAdjustment,
  PriceLock,
  CustomerQuote,
} from '@/types'
import {
  inventoryApi,
  customerApi,
  adjustmentsApi,
  priceLocksApi,
  quotesApi,
} from '@/lib/api'

interface AppState {
  inventory: Inventory[]
  customers: Customer[]
  adjustments: PriceAdjustment[]
  priceLocks: PriceLock[]
  quotes: CustomerQuote[]
  loading: boolean
  error: string | null

  fetchAll: () => Promise<void>
  fetchInventory: () => Promise<void>
  fetchCustomers: () => Promise<void>
  fetchAdjustments: () => Promise<void>
  fetchPriceLocks: () => Promise<void>
  fetchQuotes: () => Promise<void>

  createAdjustment: (payload: {
    inventory_id: string
    original_price: number
    new_price: number
    adjustment_type: string
    reason?: string
    requested_lock_days?: number
    customer_id: string
    applicant_name: string
  }) => Promise<void>

  reviewAdjustment: (
    id: string,
    payload: {
      action: 'approve' | 'reject'
      opinion?: string
      lockDays?: number
      reviewerName?: string
    },
  ) => Promise<void>

  expireLock: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  inventory: [],
  customers: [],
  adjustments: [],
  priceLocks: [],
  quotes: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [inv, cust, adj, locks, qts] = await Promise.all([
        inventoryApi.list(),
        customerApi.list(),
        adjustmentsApi.list(),
        priceLocksApi.list(),
        quotesApi.list(),
      ])
      set({
        inventory: inv,
        customers: cust,
        adjustments: adj,
        priceLocks: locks,
        quotes: qts,
        loading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchInventory: async () => {
    try {
      const data = await inventoryApi.list()
      set({ inventory: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  fetchCustomers: async () => {
    try {
      const data = await customerApi.list()
      set({ customers: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  fetchAdjustments: async () => {
    try {
      const data = await adjustmentsApi.list()
      set({ adjustments: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  fetchPriceLocks: async () => {
    try {
      const data = await priceLocksApi.list()
      set({ priceLocks: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  fetchQuotes: async () => {
    try {
      const data = await quotesApi.list()
      set({ quotes: data })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  createAdjustment: async (payload) => {
    set({ loading: true, error: null })
    try {
      await adjustmentsApi.create(payload)
      await get().fetchAdjustments()
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  reviewAdjustment: async (id, payload) => {
    set({ loading: true, error: null })
    try {
      await adjustmentsApi.review(id, payload)
      await Promise.all([
        get().fetchAdjustments(),
        get().fetchPriceLocks(),
        get().fetchQuotes(),
      ])
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  expireLock: async (id) => {
    set({ loading: true, error: null })
    try {
      await priceLocksApi.expire(id)
      await get().fetchPriceLocks()
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },
}))
