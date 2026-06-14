
export type TicketStatus = 'pending' | 'approved' | 'repairing' | 'completed' | 'rejected'
export type TicketPriority = 'low' | 'medium' | 'high'
export type UserRole = 'clerk' | 'manager' | 'admin'
export type HandoverType = 'shift_close' | 'prize_claim' | 'normal_fault'

export type TicketCategory = 'shift_issue' | 'prize_device' | 'print_error' | 'network_issue' | 'other'

export interface ShiftCloseInfo {
  shiftId: string
  shiftDate: string
  shiftPeriod: 'morning' | 'afternoon' | 'evening' | 'night'
  salesAmount: number
  ticketCount: number
  remark?: string
}

export interface PrizeClaimInfo {
  claimId: string
  claimDate: string
  prizeLevel: string
  prizeAmount: number
  ticketId: string
  deviceUsed: boolean
  remark?: string
}

export interface ProcessStep {
  id: string
  action: string
  operator: string
  timestamp: string
  remark?: string
  role?: UserRole
}

export interface FaultTicket {
  id: string
  deviceId: string
  deviceName: string
  storeId: string
  storeName: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  description: string
  remarks: string
  createdAt: string
  updatedAt: string
  createdBy: string
  assignedTo?: string
  processHistory: ProcessStep[]
  handoverType?: HandoverType
  shiftCloseInfo?: ShiftCloseInfo
  prizeClaimInfo?: PrizeClaimInfo
  isAlert?: boolean
  alertMessage?: string
  rejectedReason?: string
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
  handoverType?: HandoverType
  shiftCloseInfo?: ShiftCloseInfo
  prizeClaimInfo?: PrizeClaimInfo
}
