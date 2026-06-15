export type Role = 'dispatcher' | 'team_leader' | 'customer_service'

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled'

export type ExceptionType = 'price_increase' | 'damage' | 'delay'

export type ExceptionStatus = 'pending' | 'processing' | 'resolved'

export interface Address {
  province: string
  city: string
  district: string
  detail: string
}

export interface Contact {
  name: string
  phone: string
  wechat?: string
}

export interface Item {
  id: string
  name: string
  quantity: number
  weight: number
  volume: number
  fragile: boolean
  material: string
  remark: string
  lastConclusion?: string
}

export interface ExceptionRecord {
  id: string
  appointmentId: string
  type: ExceptionType
  description: string
  amount?: number
  photos?: string[]
  status: ExceptionStatus
  createdAt: string
  responsibleRole?: Role
  dueTime?: string
  isOverdue?: boolean
  timeNote?: string
  handledBy?: string
  handledAt?: string
  resolution?: string
}

export interface Appointment {
  id: string
  orderNo: string
  customer: Contact
  fromAddress: Address
  toAddress: Address
  date: string
  timeSlot: string
  vehicleType: string
  estimatedPrice: number
  actualPrice?: number
  status: AppointmentStatus
  items: Item[]
  exceptions: ExceptionRecord[]
  rejectReason?: string
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  role: Role
  phone: string
}

export interface TodoItem {
  id: string
  type: 'appointment' | 'exception' | 'task'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueTime?: string
  isOverdue?: boolean
  responsibleRole?: Role
  appointmentId?: string
  exceptionId?: string
}