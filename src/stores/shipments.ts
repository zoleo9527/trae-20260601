import { create } from 'zustand'
import type { Shipment } from '../shared/types'
import { useAuthStore } from './auth'

interface ShipmentFilters {
  page?: number
  limit?: number
  [key: string]: unknown
}

interface ShipmentsState {
  shipments: Shipment[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  fetchShipments: (filters?: ShipmentFilters) => Promise<void>
  confirmShipment: (id: string, logisticsCompany: string, trackingNo: string) => Promise<void>
  receiveShipment: (id: string, receiveRemark?: string) => Promise<void>
}

export const useShipmentsStore = create<ShipmentsState>((set, get) => ({
  shipments: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,

  fetchShipments: async (filters?: ShipmentFilters) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        set({ isLoading: false })
        return
      }
      const currentFilters = { ...filters }
      
      const params = new URLSearchParams()
      if (currentFilters.page) params.append('page', currentFilters.page.toString())
      if (currentFilters.limit) params.append('limit', currentFilters.limit.toString())
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'page' && key !== 'limit') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/shipments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shipments')
      }

      const data = await response.json()
      set({
        shipments: data.data || [],
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  confirmShipment: async (id: string, logisticsCompany: string, trackingNo: string) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/shipments/${id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logisticsCompany, trackingNo }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || '确认发货失败，请重试')
      }

      const updatedShipment = await response.json()
      set((state) => ({
        shipments: state.shipments.map((s) => (s.id === id ? updatedShipment : s)),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  receiveShipment: async (id: string, receiveRemark?: string) => {
    set({ isLoading: true })
    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`/api/shipments/${id}/receive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiveRemark }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || '确认签收失败，请重试')
      }

      const updatedShipment = await response.json()
      set((state) => ({
        shipments: state.shipments.map((s) => (s.id === id ? updatedShipment : s)),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))
