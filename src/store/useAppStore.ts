import { create } from 'zustand'
import dayjs from 'dayjs'
import type {
  User, UserRole, Order, Customer, Proof, Machine, ScheduleWithDetails,
  WorkspaceState, OrderStatus, QuoteCalculationInput, QuoteResult
} from '../types'

interface AppState {
  currentUser: User | null
  workspace: WorkspaceState | null
  orders: Order[]
  customers: Customer[]
  machines: Machine[]
  schedules: ScheduleWithDetails[]
  selectedOrder: Order | null
  selectedOrderProofs: Proof[]
  quoteResult: QuoteResult | null
  loading: boolean
  error: string | null
  
  initApp: () => Promise<void>
  switchRole: (role: UserRole, options?: { preserveView?: boolean; searchQuery?: string }) => Promise<boolean>
  saveWorkspace: (updates: Partial<WorkspaceState>) => Promise<void>
  
  loadOrders: (status?: OrderStatus, search?: string) => Promise<void>
  loadOrderById: (id: number) => Promise<void>
  loadOrderProofs: (orderId: number) => Promise<void>
  createOrder: (order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>) => Promise<boolean>
  updateOrder: (id: number, updates: Partial<Order>) => Promise<boolean>
  updateOrderStatus: (orderId: number, newStatus: OrderStatus, note?: string) => Promise<boolean>
  
  loadCustomers: (search?: string) => Promise<void>
  createCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
  
  loadMachines: () => Promise<void>
  updateMachineStatus: (id: number, status: any, note?: string) => Promise<boolean>
  
  loadSchedules: (date?: string, machineId?: number) => Promise<void>
  createSchedule: (schedule: any) => Promise<boolean>
  updateSchedule: (id: number, updates: any) => Promise<boolean>
  
  calculateQuote: (input: QuoteCalculationInput) => Promise<void>
  clearQuoteResult: () => void
  
  createProof: (orderId: number, filePath?: string, fileName?: string) => Promise<boolean>
  reviewProof: (proofId: number, status: 'approved' | 'rejected', feedback?: string) => Promise<boolean>
  selectProofFile: () => Promise<{ canceled: boolean; filePaths?: string[] }>
  
  exportData: () => Promise<boolean>
  importData: () => Promise<{ success: boolean; count?: number }>
  
  setSelectedOrder: (order: Order | null) => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  workspace: null,
  orders: [],
  customers: [],
  machines: [],
  schedules: [],
  selectedOrder: null,
  selectedOrderProofs: [],
  quoteResult: null,
  loading: false,
  error: null,

  initApp: async () => {
    set({ loading: true })
    try {
      const [wsResult, userResult, customersResult, machinesResult] = await Promise.all([
        window.api.getWorkspaceState(),
        window.api.getCurrentUser(),
        window.api.getCustomers(),
        window.api.getMachines()
      ])
      
      const workspace = wsResult.success ? wsResult.data : null
      const currentUserFromApi = userResult.success ? userResult.data : null
      
      set({
        workspace,
        currentUser: currentUserFromApi,
        customers: customersResult.success ? customersResult.data || [] : [],
        machines: machinesResult.success ? machinesResult.data || [] : [],
      })
      
      if (workspace?.current_role && currentUserFromApi?.role !== workspace.current_role) {
        await get().switchRole(workspace.current_role, {
          preserveView: true,
          searchQuery: workspace.search_query || undefined
        })
        return
      }
      
      if (workspace?.current_role === 'sales') {
        await get().loadOrders(undefined, workspace.search_query)
      } else if (workspace?.current_role === 'designer') {
        await get().loadOrders(undefined, workspace.search_query)
      } else if (workspace?.current_role === 'production') {
        const today = dayjs().format('YYYY-MM-DD')
        await Promise.all([
          get().loadOrders(undefined, workspace.search_query),
          get().loadSchedules(today)
        ])
      } else {
        await get().loadOrders()
      }
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  switchRole: async (role, options) => {
    set({ loading: true })
    try {
      const result = await window.api.switchRole(role)
      if (result.success && result.data) {
        set({ currentUser: result.data })
        await get().saveWorkspace({ current_role: role })
        
        const search = options?.searchQuery

        if (!options?.preserveView) {
          if (role === 'sales') {
            await get().saveWorkspace({ current_view: 'sales-dashboard' })
          } else if (role === 'designer') {
            await get().saveWorkspace({ current_view: 'designer-dashboard' })
          } else if (role === 'production') {
            await get().saveWorkspace({ current_view: 'production-dashboard' })
          }
        }

        if (role === 'sales') {
          await get().loadOrders(undefined, search)
        } else if (role === 'designer') {
          await get().loadOrders(undefined, search)
        } else if (role === 'production') {
          const today = dayjs().format('YYYY-MM-DD')
          await Promise.all([
            get().loadOrders(undefined, search),
            get().loadSchedules(today)
          ])
        }
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    } finally {
      set({ loading: false })
    }
  },

  saveWorkspace: async (updates: Partial<WorkspaceState>) => {
    try {
      const result = await window.api.saveWorkspaceState(updates)
      if (result.success && result.data) {
        set({ workspace: result.data })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  loadOrders: async (status?: OrderStatus, search?: string) => {
    set({ loading: true })
    try {
      const result = await window.api.getOrders(status, undefined, undefined, search)
      if (result.success) {
        set({ orders: result.data || [] })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  loadOrderById: async (id: number) => {
    try {
      const result = await window.api.getOrderById(id)
      if (result.success && result.data) {
        set({ selectedOrder: result.data })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  loadOrderProofs: async (orderId: number) => {
    try {
      const result = await window.api.getProofsByOrder(orderId)
      if (result.success) {
        set({ selectedOrderProofs: result.data || [] })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  createOrder: async (order) => {
    try {
      const result = await window.api.createOrder(order)
      if (result.success) {
        await get().loadOrders()
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  updateOrder: async (id: number, updates: Partial<Order>) => {
    try {
      const result = await window.api.updateOrder(id, updates)
      if (result.success) {
        await get().loadOrders()
        if (get().selectedOrder?.id === id && result.data) {
          set({ selectedOrder: result.data })
        }
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  updateOrderStatus: async (orderId: number, newStatus: OrderStatus, note?: string) => {
    const user = get().currentUser
    if (!user) return false
    
    try {
      const result = await window.api.updateOrderStatus(orderId, newStatus, user.id, note)
      if (result.success) {
        await get().loadOrders()
        if (get().selectedOrder?.id === orderId && result.data) {
          set({ selectedOrder: result.data })
        }
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  loadCustomers: async (search?: string) => {
    try {
      const result = await window.api.getCustomers(search)
      if (result.success) {
        set({ customers: result.data || [] })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  createCustomer: async (customer) => {
    try {
      const result = await window.api.createCustomer(customer)
      if (result.success) {
        await get().loadCustomers()
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  loadMachines: async () => {
    try {
      const result = await window.api.getMachines()
      if (result.success) {
        set({ machines: result.data || [] })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  updateMachineStatus: async (id: number, status: any, note?: string) => {
    try {
      const result = await window.api.updateMachineStatus(id, status, note)
      if (result.success) {
        await get().loadMachines()
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  loadSchedules: async (date?: string, machineId?: number) => {
    try {
      const result = await window.api.getSchedules(date, machineId)
      if (result.success) {
        set({ schedules: result.data || [] })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  createSchedule: async (schedule) => {
    try {
      const result = await window.api.createSchedule(schedule)
      if (result.success) {
        const today = dayjs().format('YYYY-MM-DD')
        await get().loadSchedules(today)
        await get().loadOrders()
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  updateSchedule: async (id: number, updates: any) => {
    try {
      const result = await window.api.updateSchedule(id, updates)
      if (result.success) {
        const today = dayjs().format('YYYY-MM-DD')
        await get().loadSchedules(today)
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  calculateQuote: async (input: QuoteCalculationInput) => {
    try {
      const result = await window.api.calculateQuote(input)
      set({ quoteResult: result })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  clearQuoteResult: () => {
    set({ quoteResult: null })
  },

  createProof: async (orderId: number, filePath?: string, fileName?: string) => {
    const user = get().currentUser
    if (!user) return false
    
    try {
      const result = await window.api.createProof({
        order_id: orderId,
        file_path: filePath,
        file_name: fileName,
        status: 'uploaded',
        uploaded_by: user.id,
        version: 1
      })
      if (result.success) {
        await get().loadOrderProofs(orderId)
        await get().loadOrders()
        if (get().selectedOrder?.id === orderId) {
          await get().loadOrderById(orderId)
        }
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  reviewProof: async (proofId: number, status: 'approved' | 'rejected', feedback?: string) => {
    const user = get().currentUser
    if (!user) return false
    
    try {
      const result = await window.api.reviewProof(proofId, status, user.id, feedback)
      if (result.success && result.data) {
        await get().loadOrderProofs(result.data.order_id)
        await get().loadOrders()
        if (get().selectedOrder?.id === result.data.order_id) {
          await get().loadOrderById(result.data.order_id)
        }
      }
      return result.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  selectProofFile: async () => {
    return await window.api.selectProofFile()
  },

  exportData: async () => {
    try {
      const dataResult = await window.api.exportData()
      if (!dataResult.success || !dataResult.data) {
        return false
      }
      
      const defaultName = `print-factory-data-${dayjs().format('YYYYMMDD-HHmmss')}.json`
      const dialogResult = await window.api.showExportDialog(defaultName)
      if (dialogResult.canceled || !dialogResult.filePath) {
        return false
      }
      
      const writeResult = await window.api.writeJsonFile(dialogResult.filePath, dataResult.data)
      return writeResult.success
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  importData: async () => {
    try {
      const dialogResult = await window.api.showImportDialog()
      if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        return { success: false }
      }
      
      const data = await window.api.readJsonFile(dialogResult.filePaths[0])
      const result = await window.api.importData(data)
      
      if (result.success) {
        await get().initApp()
      }
      
      return { success: result.success, count: result.data?.count }
    } catch (e) {
      set({ error: (e as Error).message })
      return { success: false }
    }
  },

  setSelectedOrder: (order: Order | null) => {
    set({ selectedOrder: order })
    if (order) {
      get().loadOrderProofs(order.id)
    } else {
      set({ selectedOrderProofs: [] })
    }
  },

  setError: (error: string | null) => {
    set({ error })
  }
}))
