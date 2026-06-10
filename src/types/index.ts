export type Role = 'technician' | 'service' | 'supervisor'

export type OrderStatus = 'pending' | 'checked_in' | 'reviewing' | 'completed' | 'rejected'

export type MaintenanceType = 'routine' | 'quarterly' | 'annual'

export interface MaintenanceOrder {
  id: string
  elevatorNo: string
  elevatorAddress: string
  maintenanceType: MaintenanceType
  plannedDate: string
  status: OrderStatus
  assignedTechnician: string
  checkinTime: string | null
  checkinAnomaly: boolean
  checkinAnomalyDesc: string | null
  currentHandler: Role
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  orderId: string
  role: Role | 'system'
  action: string
  detail: string
  timestamp: string
}

export interface OrderNote {
  id: string
  orderId: string
  role: Role
  content: string
  timestamp: string
}

export interface OrderDetail extends MaintenanceOrder {
  timeline: TimelineEvent[]
  notes: OrderNote[]
}

export interface RoleInfo {
  key: Role
  label: string
  description: string
}
