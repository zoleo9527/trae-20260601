import { create } from 'zustand'
import { 
  PurchaseOrder, 
  User, 
  Role,
  SampleRecord
} from '../types'
import { api } from '../services/api'

interface AppState {
  currentUser: User
  users: User[]
  purchaseOrders: PurchaseOrder[]
  selectedPurchaseId: string | null
  activeDrawer: 'acceptance' | 'sample' | 'exception' | 'resubmit' | null
  notification: { type: 'success' | 'info' | 'warning' | 'error'; message: string } | null
  loading: boolean
  
  setCurrentUser: (user: User) => void
  switchRole: (role: Role) => void
  setSelectedPurchaseId: (id: string | null) => void
  setActiveDrawer: (drawer: 'acceptance' | 'sample' | 'exception' | 'resubmit' | null) => void
  setNotification: (notification: { type: 'success' | 'info' | 'warning' | 'error'; message: string } | null) => void
  
  fetchPurchases: () => Promise<void>
  fetchUsers: () => Promise<void>
  
  processAcceptance: (purchaseId: string, action: 'accept' | 'reject' | 'supplement', remark?: string) => Promise<void>
  resubmitAcceptance: (purchaseId: string, remark?: string) => Promise<void>
  submitSample: (purchaseId: string, sampleData: Omit<SampleRecord, 'id' | 'purchaseId' | 'operatorId' | 'operatorName'>) => Promise<void>
  confirmSample: (purchaseId: string, remark?: string) => Promise<void>
  addExceptionComment: (purchaseId: string, exceptionId: string, content: string) => Promise<void>
  resolveException: (purchaseId: string, exceptionId: string, resolution: string) => Promise<void>
  mediateDispute: (purchaseId: string, resolution: string, resolutionType: 'accept' | 'reject' | 'compromise') => Promise<void>
  addDisputeComment: (purchaseId: string, content: string) => Promise<void>
  
  getFilteredPurchases: () => PurchaseOrder[]
  getSelectedPurchase: () => PurchaseOrder | undefined
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: { id: 'u1', name: '张管理', role: 'admin' },
  users: [],
  purchaseOrders: [],
  selectedPurchaseId: null,
  activeDrawer: null,
  notification: null,
  loading: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role) => {
    const { users } = get()
    const user = users.find(u => u.role === role)
    if (user) {
      set({ currentUser: user, selectedPurchaseId: null, activeDrawer: null, notification: null })
    }
  },

  setSelectedPurchaseId: (id) => set({ selectedPurchaseId: id }),

  setActiveDrawer: (drawer) => set({ activeDrawer: drawer }),

  setNotification: (notification) => set({ notification }),

  fetchPurchases: async () => {
    try {
      set({ loading: true })
      const data = await api.purchaseOrders.getAll()
      set({ purchaseOrders: data, loading: false })
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '加载采购单失败' } })
    }
  },

  fetchUsers: async () => {
    try {
      const data = await api.users.getAll()
      set({ users: data })
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  },

  processAcceptance: async (purchaseId, action, remark) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.acceptance.process(purchaseId, {
        action,
        remark: remark || '',
        operatorId: currentUser.id,
        operatorName: currentUser.name
      })
      await fetchPurchases()
      set({ loading: false })
      
      if (action === 'accept') {
        set({ activeDrawer: 'sample' })
        set({ notification: { type: 'success', message: '验收通过，已进入留样登记环节' } })
      } else if (action === 'supplement') {
        set({ activeDrawer: null })
        set({ notification: { type: 'warning', message: '已要求采购员补充材料' } })
      } else {
        set({ activeDrawer: null })
        set({ notification: { type: 'error', message: '已驳回该采购单' } })
      }
    } catch (error) {
      console.error('Failed to process acceptance:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '验收处理失败' } })
    }
  },

  resubmitAcceptance: async (purchaseId, remark) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.acceptance.resubmit(purchaseId, {
        remark: remark || '',
        operatorId: currentUser.id,
        operatorName: currentUser.name
      })
      await fetchPurchases()
      set({ loading: false, activeDrawer: null })
      set({ notification: { type: 'success', message: '补录材料已提交，等待管理员重新验收' } })
    } catch (error) {
      console.error('Failed to resubmit:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '提交失败' } })
    }
  },

  submitSample: async (purchaseId, sampleData) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.samples.submit(purchaseId, {
        ...sampleData,
        operatorId: currentUser.id,
        operatorName: currentUser.name
      })
      await fetchPurchases()
      set({ loading: false, activeDrawer: null })
      set({ notification: { type: 'success', message: '留样登记完成，已通知班主任确认' } })
    } catch (error) {
      console.error('Failed to submit sample:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '留样登记失败' } })
    }
  },

  confirmSample: async (purchaseId, remark) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.samples.confirm(purchaseId, {
        remark,
        operatorId: currentUser.id,
        operatorName: currentUser.name
      })
      await fetchPurchases()
      set({ loading: false, activeDrawer: null })
      set({ notification: { type: 'success', message: '留样确认完成，流程结束' } })
    } catch (error) {
      console.error('Failed to confirm sample:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '确认失败' } })
    }
  },

  addExceptionComment: async (purchaseId, exceptionId, content) => {
    try {
      const { currentUser, fetchPurchases } = get()
      await api.exceptions.addComment(purchaseId, exceptionId, {
        userId: currentUser.id,
        userName: currentUser.name,
        content
      })
      await fetchPurchases()
    } catch (error) {
      console.error('Failed to add comment:', error)
      set({ notification: { type: 'error', message: '发送失败' } })
    }
  },

  resolveException: async (purchaseId, exceptionId, resolution) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.exceptions.resolve(purchaseId, exceptionId, {
        userId: currentUser.id,
        userName: currentUser.name,
        resolution
      })
      await fetchPurchases()
      set({ loading: false })
      set({ notification: { type: 'success', message: '异常已处理' } })
    } catch (error) {
      console.error('Failed to resolve exception:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '处理失败' } })
    }
  },

  mediateDispute: async (purchaseId, resolution, resolutionType) => {
    try {
      set({ loading: true })
      const { currentUser, fetchPurchases } = get()
      await api.disputes.mediate(purchaseId, {
        mediatorId: currentUser.id,
        mediatorName: currentUser.name,
        resolution,
        resolutionType
      })
      await fetchPurchases()
      set({ loading: false, activeDrawer: null })
      set({ notification: { type: 'success', message: '争议仲裁已完成' } })
    } catch (error) {
      console.error('Failed to mediate dispute:', error)
      set({ loading: false })
      set({ notification: { type: 'error', message: '仲裁失败' } })
    }
  },

  addDisputeComment: async (purchaseId, content) => {
    try {
      const { currentUser, fetchPurchases } = get()
      await api.disputes.addComment(purchaseId, {
        userId: currentUser.id,
        userName: currentUser.name,
        content
      })
      await fetchPurchases()
    } catch (error) {
      console.error('Failed to add dispute comment:', error)
      set({ notification: { type: 'error', message: '发送失败' } })
    }
  },

  getFilteredPurchases: () => {
    const { purchaseOrders, currentUser } = get()
    
    if (currentUser.role === 'purchaser') {
      return purchaseOrders.filter(po => po.purchaserId === currentUser.id)
    }
    
    return purchaseOrders
  },

  getSelectedPurchase: () => {
    const { purchaseOrders, selectedPurchaseId } = get()
    return purchaseOrders.find(p => p.id === selectedPurchaseId)
  }
}))
