import { create } from 'zustand'
import type { Order, SparePart, OrderStatus } from '../types'

interface AppState {
  orders: Order[]
  currentOrder: Order | null
  spareParts: SparePart[]
  currentUser: { id: string; name: string; role: 'front' | 'technician' | 'manager' }
  setOrders: (orders: Order[]) => void
  setCurrentOrder: (order: Order | null) => void
  setSpareParts: (parts: SparePart[]) => void
  setCurrentUser: (user: { id: string; name: string; role: 'front' | 'technician' | 'manager' }) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
}

export const useAppStore = create<AppState>((set) => ({
  orders: [],
  currentOrder: null,
  spareParts: [],
  currentUser: { id: 'front-001', name: '前台-王芳', role: 'front' },
  
  setOrders: (orders) => set({ orders }),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setSpareParts: (parts) => set({ spareParts: parts }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === id ? { ...order, status, updated_at: new Date().toISOString() } : order
    ),
    currentOrder: state.currentOrder?.id === id 
      ? { ...state.currentOrder, status, updated_at: new Date().toISOString() } 
      : state.currentOrder
  }))
}))