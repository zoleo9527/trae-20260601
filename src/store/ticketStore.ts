
import { create } from 'zustand'
import { FaultTicket, User, TicketStatus, CreateTicketForm, TicketPriority } from '../types'
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
  getFilteredTickets: () => FaultTicket[]
  getStats: () => { pending: number; repairing: number; completed: number; rejected: number; approved: number }
}

const generateId = () => Math.random().toString(36).substring(2, 11)

const getCurrentTimestamp = () => new Date().toISOString()

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
    const newTicket: FaultTicket = {
      id: generateId(),
      deviceId: form.deviceId,
      deviceName: form.deviceName,
      storeId: currentUser.storeId || '',
      storeName: currentUser.storeName || '',
      status: 'pending',
      priority: form.priority,
      description: form.description,
      remarks: form.remarks || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      createdBy: currentUser.name,
      processHistory: [
        {
          id: generateId(),
          action: '提交故障单',
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark: form.remarks,
        },
      ],
    }
    set({ tickets: [...tickets, newTicket] })
  },

  updateTicketStatus: (ticketId, status, remark) => {
    const { tickets, currentUser } = get()
    const updatedTickets = tickets.map((ticket) => {
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
        },
      ]

      return {
        ...ticket,
        status,
        updatedAt: getCurrentTimestamp(),
        remarks: remark ? `${ticket.remarks}\n${remark}` : ticket.remarks,
        processHistory: newHistory,
        assignedTo: status === 'repairing' ? '维修人员' : ticket.assignedTo,
      }
    })
    set({ tickets: updatedTickets })
    set({ selectedTicket: updatedTickets.find((t) => t.id === ticketId) || null })
  },

  addRemark: (ticketId, remark) => {
    const { tickets, currentUser } = get()
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket

      const newHistory = [
        ...ticket.processHistory,
        {
          id: generateId(),
          action: '添加备注',
          operator: currentUser.name,
          timestamp: getCurrentTimestamp(),
          remark,
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
