import { create } from 'zustand'
import { 
  PurchaseOrder, 
  User, 
  Role, 
  PurchaseStatus,
  AcceptanceRecord,
  SampleRecord,
  ExceptionRecord,
  ExceptionComment
} from '../types'
import { mockPurchaseOrders, mockUsers } from '../data/mockData'

interface AppState {
  currentUser: User
  users: User[]
  purchaseOrders: PurchaseOrder[]
  selectedPurchaseId: string | null
  activeDrawer: 'acceptance' | 'sample' | 'exception' | null
  notification: { type: 'success' | 'info' | 'warning'; message: string } | null
  
  setCurrentUser: (user: User) => void
  switchRole: (role: Role) => void
  setSelectedPurchaseId: (id: string | null) => void
  setActiveDrawer: (drawer: 'acceptance' | 'sample' | 'exception' | null) => void
  setNotification: (notification: { type: 'success' | 'info' | 'warning'; message: string } | null) => void
  
  processAcceptance: (purchaseId: string, action: 'accept' | 'reject' | 'supplement', remark?: string) => void
  submitSample: (purchaseId: string, sampleData: Omit<SampleRecord, 'id' | 'purchaseId' | 'operatorId' | 'operatorName'>) => void
  addExceptionComment: (purchaseId: string, exceptionId: string, content: string) => void
  resolveException: (purchaseId: string, exceptionId: string, resolution: string) => void
  submitSupplement: (purchaseId: string, remark?: string) => void
  getFilteredPurchases: () => PurchaseOrder[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  purchaseOrders: mockPurchaseOrders,
  selectedPurchaseId: null,
  activeDrawer: null,
  notification: null,

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

  processAcceptance: (purchaseId, action, remark) => {
    const { currentUser } = get()
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)
    
    const acceptanceRecord: AcceptanceRecord = {
      id: generateId(),
      purchaseId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action,
      remark,
      timestamp: now
    }

    set((state) => {
      const newStatus: PurchaseStatus = 
        action === 'accept' ? 'sample_pending' :
        action === 'supplement' ? 'supplementing' :
        'rejected'

      let newException: ExceptionRecord | null = null
      if (action === 'supplement' || action === 'reject') {
        newException = {
          id: generateId(),
          purchaseId,
          type: action === 'supplement' ? 'supplement' : 'reject',
          initiatorId: currentUser.id,
          initiatorName: currentUser.name,
          handlerId: state.purchaseOrders.find(p => p.id === purchaseId)?.purchaserId,
          handlerName: state.purchaseOrders.find(p => p.id === purchaseId)?.purchaserName,
          description: remark || `${action === 'supplement' ? '需要补充材料' : '验收被驳回'}`,
          status: 'processing',
          createdAt: now
        }
      }

      return {
        purchaseOrders: state.purchaseOrders.map(po => {
          if (po.id === purchaseId) {
            return {
              ...po,
              status: newStatus,
              acceptanceRecords: [...po.acceptanceRecords, acceptanceRecord],
              exceptions: newException ? [...po.exceptions, newException] : po.exceptions,
              currentHandlerId: action === 'accept' ? currentUser.id : po.purchaserId,
              currentHandlerName: action === 'accept' ? currentUser.name : po.purchaserName,
              updatedAt: now
            }
          }
          return po
        })
      }
    })
  },

  submitSample: (purchaseId, sampleData) => {
    const { currentUser } = get()
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)

    const sampleRecord: SampleRecord = {
      id: generateId(),
      purchaseId,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      ...sampleData
    }

    set((state) => ({
      purchaseOrders: state.purchaseOrders.map(po => {
        if (po.id === purchaseId) {
          return {
            ...po,
            status: 'sample_completed',
            sampleRecord,
            updatedAt: now,
            currentHandlerId: undefined,
            currentHandlerName: undefined
          }
        }
        return po
      })
    }))
  },

  addExceptionComment: (purchaseId, exceptionId, content) => {
    const { currentUser } = get()
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)

    const comment: ExceptionComment = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      timestamp: now
    }

    set((state) => ({
      purchaseOrders: state.purchaseOrders.map(po => {
        if (po.id === purchaseId) {
          return {
            ...po,
            exceptions: po.exceptions.map(ex => {
              if (ex.id === exceptionId) {
                return {
                  ...ex,
                  comments: [...(ex.comments || []), comment]
                }
              }
              return ex
            }),
            updatedAt: now
          }
        }
        return po
      })
    }))
  },

  resolveException: (purchaseId, exceptionId, resolution) => {
    const { currentUser } = get()
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)

    set((state) => ({
      purchaseOrders: state.purchaseOrders.map(po => {
        if (po.id === purchaseId) {
          const hasOtherUnresolved = po.exceptions.some(
            ex => ex.id !== exceptionId && (ex.status === 'pending' || ex.status === 'processing')
          )
          return {
            ...po,
            status: hasOtherUnresolved ? po.status : 'pending_acceptance',
            exceptions: po.exceptions.map(ex => {
              if (ex.id === exceptionId) {
                return {
                  ...ex,
                  status: 'resolved',
                  resolvedAt: now,
                  resolution,
                  handlerId: currentUser.id,
                  handlerName: currentUser.name
                }
              }
              return ex
            }),
            currentHandlerId: hasOtherUnresolved ? po.currentHandlerId : undefined,
            currentHandlerName: hasOtherUnresolved ? po.currentHandlerName : undefined,
            updatedAt: now
          }
        }
        return po
      })
    }))
  },

  submitSupplement: (purchaseId, remark) => {
    const { currentUser } = get()
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)

    set((state) => ({
      purchaseOrders: state.purchaseOrders.map(po => {
        if (po.id === purchaseId) {
          return {
            ...po,
            status: 'pending_acceptance',
            currentHandlerId: state.users.find(u => u.role === 'admin')?.id,
            currentHandlerName: state.users.find(u => u.role === 'admin')?.name,
            exceptions: po.exceptions.map(ex => ({
              ...ex,
              status: ex.type === 'supplement' ? 'resolved' : ex.status,
              resolvedAt: ex.type === 'supplement' ? now : ex.resolvedAt,
              resolution: ex.type === 'supplement' ? (remark || '材料已补充') : ex.resolution
            })),
            updatedAt: now
          }
        }
        return po
      })
    }))
  },

  getFilteredPurchases: () => {
    const { purchaseOrders, currentUser } = get()
    
    if (currentUser.role === 'purchaser') {
      return purchaseOrders.filter(po => po.purchaserId === currentUser.id)
    }
    
    return purchaseOrders
  }
}))
