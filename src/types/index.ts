
export type TicketStatus = 'pending' | 'approved' | 'repairing' | 'completed' | 'rejected'
export type TicketPriority = 'low' | 'medium' | 'high'
export type UserRole = 'clerk' | 'manager' | 'admin'

export interface ProcessStep {
  id: string
  action: string
  operator: string
  timestamp: string
  remark?: string
}

export interface FaultTicket {
  id: string
  deviceId: string
  deviceName: string
  storeId: string
  storeName: string
  status: TicketStatus
  priority: TicketPriority
  description: string
  remarks: string
  createdAt: string
  updatedAt: string
  createdBy: string
  assignedTo?: string
  processHistory: ProcessStep[]
}

export interface User {
  id: string
  name: string
  role: UserRole
  storeId?: string
  storeName?: string
}

export interface CreateTicketForm {
  deviceId: string
  deviceName: string
  description: string
  priority: TicketPriority
  remarks?: string
}
