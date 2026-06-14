import { create } from 'zustand'
import { FaultTicket, User, TicketStatus, CreateTicketForm, TicketPriority, UserRole, HandoverType } from '../types'
import { mockTickets, mockUsers } from '../data/mockData'

interface TicketStore {
  tickets: FaultTicket[]
  currentUser: User
  selectedTicket: FaultTicket | null
  filterStatus: TicketStatus | 'all'
  searchKeyword: string
  setCurrentUser: (user: User) => void
  setFilterStatus: (status: TicketStatus | 'all') => void
  setSearchKeyword: (keyword: string) => void
  selectTicket: (ticket: FaultTicket | null) => void
  createTicket: (form: CreateTicketForm) => void
  updateTicketStatus: (ticketId: string, status: TicketStatus, remark?: string) => void
  addRemark: (ticketId: string, remark: string) => void
  supplementTicket: (ticketId: string, remark: string) => void
  getFilteredTickets: () => FaultTicket[]
  getStats: () => { pending: number; repairing: number; completed: number; rejected: number; approved: number }
}

const generateId = () => Math.random().toString(36).substring(2, 11)

const getCurrentTimestamp = () => new Date().toISOString()

const getHandoverLabel = (handoverType?: HandoverType): string => {
  if (!handoverType || handoverType === 'normal_fault') return ''
  return handoverType === 'shift_close' ? '销售班结' : '兑奖登记'
}

const buildHandoverRemark = (form: CreateTicketForm): string => {
  if (!form.handoverType || form.handoverType === 'normal_fault') return form.remarks || ''
  
  let remark = ''
  
  if (form.handoverType === 'shift_close' && form.shiftCloseInfo) {
    remark = `【班结交接】单号: ${form.shiftCloseInfo.shiftId}, 日期: ${form.shiftCloseInfo.shiftDate}, 班次: ${
      form.shiftCloseInfo.shiftPeriod === 'morning' ? '早班' :
      form.shiftCloseInfo.shiftPeriod === 'afternoon' ? '中班' :
      form.shiftCloseInfo.shiftPeriod === 'evening' ? '晚班' : '夜班'
    }, 销售额: ¥${form.shiftCloseInfo.salesAmount.toLocaleString()}`
    if (form.shiftCloseInfo.remark) {
      remark += `, 异常说明: ${form.shiftCloseInfo.remark}`
    }
  }
  
  if (form.handoverType === 'prize_claim' && form.prizeClaimInfo) {
    remark = `【兑奖交接】单号: ${form.prizeClaimInfo.claimId}, 日期: ${form.prizeClaimInfo.claimDate}, 中奖等级: ${form.prizeClaimInfo.prizeLevel}, 中奖金额: ¥${form.prizeClaimInfo.prizeAmount.toLocaleString()}, 彩票编号: ${form.prizeClaimInfo.ticketId}`
    if (form.prizeClaimInfo.remark) {
      remark += `, 异常说明: ${form.prizeClaimInfo.remark}`
    }
  }
  
  if (form.remarks) {
    remark += `\n${form.remarks}`
  }
  
  return remark
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: mockTickets,
  currentUser: mockUsers[0],
  selectedTicket: null,
  filterStatus: 'all',
  searchKeyword: '',

  setCurrentUser: (user) => set({ currentUser: user }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  selectTicket: (ticket) => set({ selectedTicket: ticket }),

  createTicket: (form) => {
    const { currentUser, tickets } = get()
    
    const handoverLabel = getHandoverLabel(form.handoverType)
    const actionText = handoverLabel ? `提交故障单（${handoverLabel}交接）` : '提交故障单'
    const fullRemark = buildHandoverRemark(form)
    
    const isAlert = form.handoverType && form.handoverType !== 'normal_fault'
    const alertMessage = isAlert 
      ? (form.handoverType === 'shift_close' 
        ? '班结交接故障单，请优先处理' 
        : '兑奖交接故障单，请优先处理')
      : undefined
    
    const newTicket: FaultTicket = {
      id: generateId(),
      deviceId: form.deviceId,
      deviceName: form.deviceName,
      storeId: currentUser.storeId || '',
      storeName: currentUser.storeName || '',
      status: 'pending',
      priority: form.priority,
      category: 'other',
      description: form.description,
      remarks: fullRemark,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      createdBy: currentUser.name,
      handoverType: form.handoverType,
      shiftCloseInfo: form.shiftCloseInfo,
      prizeClaimInfo: form.prizeClaimInfo,
      isAlert,
      alertMessage,
      processHistory: [
        {
          id: generateId(),
          action: actionText,
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark: fullRemark,
          role: currentUser.role,
        },
      ],
    }
    set({ tickets: [...tickets, newTicket] })
  },

  updateTicketStatus: (ticketId, status, remark) => {
    const { tickets, currentUser } = get()
    const updatedTickets: FaultTicket[] = tickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket

      const actionMap: Record<TicketStatus, string> = {
        pending: '提交故障单',
        approved: '审核通过',
        repairing: '派工维修',
        completed: '维修完成',
        rejected: '审核退回',
      }

      const newHistory = [
        ...ticket.processHistory,
        {
          id: generateId(),
          action: actionMap[status],
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark,
          role: currentUser.role,
        },
      ]

      const updates: Partial<FaultTicket> = {
        status,
        updatedAt: getCurrentTimestamp(),
        processHistory: newHistory,
        assignedTo: status === 'repairing' ? '维修人员' : ticket.assignedTo,
      }

      if (remark) {
        updates.remarks = `${ticket.remarks}\n${remark}`
      }

      if (status === 'rejected') {
        updates.rejectedReason = remark || ''
      }

      return {
        ...ticket,
        ...updates,
      }
    })
    set({ tickets: updatedTickets })
    set({ selectedTicket: updatedTickets.find((t) => t.id === ticketId) || null })
  },

  addRemark: (ticketId, remark) => {
    const { tickets, currentUser } = get()
    const updatedTickets: FaultTicket[] = tickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket

      const newHistory = [
        ...ticket.processHistory,
        {
          id: generateId(),
          action: '添加备注',
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark,
          role: currentUser.role,
        },
      ]

      return {
        ...ticket,
        remarks: `${ticket.remarks}\n${remark}`,
        updatedAt: getCurrentTimestamp(),
        processHistory: newHistory,
      }
    })
    set({ tickets: updatedTickets })
    set({ selectedTicket: updatedTickets.find((t) => t.id === ticketId) || null })
  },

  supplementTicket: (ticketId, remark) => {
    const { tickets, currentUser } = get()
    const updatedTickets: FaultTicket[] = tickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket

      const newHistory = [
        ...ticket.processHistory,
        {
          id: generateId(),
          action: '补充说明',
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark,
          role: currentUser.role,
        },
      ]

      return {
        ...ticket,
        status: 'pending' as TicketStatus,
        remarks: `${ticket.remarks}\n${remark}`,
        rejectedReason: undefined,
        updatedAt: getCurrentTimestamp(),
        processHistory: newHistory,
      }
    })
    set({ tickets: updatedTickets })
    set({ selectedTicket: updatedTickets.find((t) => t.id === ticketId) || null })
  },

  getFilteredTickets: () => {
    const { tickets, filterStatus, searchKeyword } = get()
    return tickets.filter((ticket) => {
      const statusMatch = filterStatus === 'all' || ticket.status === filterStatus
      const keywordMatch =
        !searchKeyword ||
        ticket.deviceId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        ticket.deviceName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchKeyword.toLowerCase())
      return statusMatch && keywordMatch
    })
  },

  getStats: () => {
    const { tickets } = get()
    const stats = { pending: 0, repairing: 0, completed: 0, rejected: 0, approved: 0 }
    tickets.forEach((ticket) => {
      stats[ticket.status]++
    })
    return stats
  },
}))