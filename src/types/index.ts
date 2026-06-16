export type ComplaintStatus = 'pending' | 'compensated' | 'followup' | 'resolved'

export type ComplaintType = 'duplicate_booking' | 'schedule_change' | 'storage_dispute' | 'over_limit' | 'other'

export type CompensateType = 'drinks' | 'discount' | 'free_entry' | 'storage'

export interface Complaint {
  id: string
  tableNumber: string
  customerName: string
  customerPhone: string
  complaintType: ComplaintType
  complaintReason: string
  status: ComplaintStatus
  createdAt: string
  updatedAt: string
  managerName: string
  tableArea: string
  compensate?: Compensation
}

export interface Compensation {
  id: string
  complaintId: string
  type: CompensateType
  amount: number
  description: string
  authorizedBy: string
  authorizedAt: string
  verifiedBy?: string
  verifiedAt?: string
  isAbnormal: boolean
  abnormalReason?: string
}

export interface Table {
  id: string
  number: string
  area: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
}

export interface User {
  id: string
  name: string
  role: 'manager' | 'bartender' | 'customer_service'
  phone: string
}