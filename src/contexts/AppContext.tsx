import { create } from 'zustand'
import type { User, Order, ProcessFeedback, AdditionRecord, ExceptionHandle } from '@/types'
import { orderService } from '@/services/orderService'
import { feedbackService } from '@/services/feedbackService'
import { additionService } from '@/services/additionService'
import { exceptionService } from '@/services/exceptionService'
import { resetMockData } from '@/services/mockData'

interface AppState {
  orders: Order[]
  feedbacks: ProcessFeedback[]
  additions: AdditionRecord[]
  handles: ExceptionHandle[]
  stuckOrders: Order[]
  stuckFeedbacks: ProcessFeedback[]
  incompleteAdditions: AdditionRecord[]
  loading: boolean
  
  loadOrders: () => void
  loadFeedbacks: () => void
  loadAdditions: () => void
  loadHandles: () => void
  loadAllData: () => void
  detectStuck: () => void
  resetData: () => void
}

export const useAppStore = create<AppState>((set) => ({
  orders: [],
  feedbacks: [],
  additions: [],
  handles: [],
  stuckOrders: [],
  stuckFeedbacks: [],
  incompleteAdditions: [],
  loading: false,
  
  loadOrders: () => {
    const { orders, stuckCount } = orderService.getOrders()
    const stuckOrders = orderService.getStuckOrders()
    set({ orders, stuckOrders })
  },
  
  loadFeedbacks: () => {
    const { feedbacks, stuckCount } = feedbackService.getFeedbacks()
    const stuckFeedbacks = feedbackService.getStuckFeedbacks()
    set({ feedbacks, stuckFeedbacks })
  },
  
  loadAdditions: () => {
    const { records, incompleteCount } = additionService.getAdditions()
    const incompleteAdditions = additionService.getIncompleteAdditions()
    set({ additions: records, incompleteAdditions })
  },
  
  loadHandles: () => {
    const { handles } = exceptionService.getHandles()
    set({ handles })
  },
  
  loadAllData: () => {
    set({ loading: true })
    const { orders } = orderService.getOrders()
    const stuckOrders = orderService.getStuckOrders()
    const { feedbacks } = feedbackService.getFeedbacks()
    const stuckFeedbacks = feedbackService.getStuckFeedbacks()
    const { records } = additionService.getAdditions()
    const incompleteAdditions = additionService.getIncompleteAdditions()
    const { handles } = exceptionService.getHandles()
    set({
      orders,
      stuckOrders,
      feedbacks,
      stuckFeedbacks,
      additions: records,
      incompleteAdditions,
      handles,
      loading: false,
    })
  },
  
  detectStuck: () => {
    orderService.detectStuckOrders()
    feedbackService.detectStuckFeedbacks()
    additionService.detectStuckAdditions()
    
    const stuckOrders = orderService.getStuckOrders()
    const stuckFeedbacks = feedbackService.getStuckFeedbacks()
    const incompleteAdditions = additionService.getIncompleteAdditions()
    
    set({ stuckOrders, stuckFeedbacks, incompleteAdditions })
  },
  
  resetData: () => {
    resetMockData()
    const { orders } = orderService.getOrders()
    const stuckOrders = orderService.getStuckOrders()
    const { feedbacks } = feedbackService.getFeedbacks()
    const stuckFeedbacks = feedbackService.getStuckFeedbacks()
    const { records } = additionService.getAdditions()
    const incompleteAdditions = additionService.getIncompleteAdditions()
    const { handles } = exceptionService.getHandles()
    
    set({
      orders,
      stuckOrders,
      feedbacks,
      stuckFeedbacks,
      additions: records,
      incompleteAdditions,
      handles,
    })
  },
}))