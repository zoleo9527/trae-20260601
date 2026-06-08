export type RoomStatus = 'dirty' | 'clean' | 'occupied' | 'inspecting' | 'maintenance'
export type InspectionTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed'
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed'
export type MinibarCheckStatus = 'pending' | 'checked' | 'anomaly'
export type UserRole = 'supervisor' | 'attendant' | 'engineer'

export interface Room {
  id: string
  number: string
  floor: string
  status: RoomStatus
  currentGuest?: string
}

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface InspectionTask {
  id: string
  roomId: string
  assignedTo?: string
  status: InspectionTaskStatus
  createdAt: string
  completedAt?: string
}

export interface InspectionResult {
  id: string
  taskId: string
  roomId: string
  facilityOk: boolean
  cleanlinessOk: boolean
  linenStatus: 'ok' | 'missing' | 'extra'
  minibarInitialStatus: 'ok' | 'partial' | 'empty'
  issues: string
  createdAt: string
}

export interface LinenRecord {
  id: string
  taskId: string
  roomId: string
  itemType: string
  expectedCount: number
  actualCount: number
  action: 'none' | 'replace' | 'replenish'
}

export interface MaintenanceOrder {
  id: string
  roomId: string
  taskId: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: MaintenanceStatus
  assignedTo?: string
  createdAt: string
  completedAt?: string
}

export interface MinibarCheck {
  id: string
  taskId: string
  roomId: string
  checkedBy?: string
  status: MinibarCheckStatus
  checkedAt?: string
  items: MinibarItem[]
}

export interface MinibarItem {
  id: string
  minibarCheckId: string
  name: string
  expectedCount: number
  actualCount: number
  unitPrice: number
  isAnomaly: boolean
}

export interface MinibarProduct {
  id: string
  name: string
  defaultCount: number
  unitPrice: number
}

export interface InspectionDraft {
  taskId: string
  roomId: string
  facilityOk: boolean
  cleanlinessOk: boolean
  issues: string
  minibarInitialStatus: 'ok' | 'partial' | 'empty'
  linenItems: {
    itemType: string
    expectedCount: number
    actualCount: number
    action: 'none' | 'replace' | 'replenish'
  }[]
  savedAt: string
}

export interface AppState {
  rooms: Room[]
  users: User[]
  inspectionTasks: InspectionTask[]
  inspectionResults: InspectionResult[]
  linenRecords: LinenRecord[]
  maintenanceOrders: MaintenanceOrder[]
  minibarChecks: MinibarCheck[]
  minibarProducts: MinibarProduct[]
  inspectionDrafts: Record<string, InspectionDraft>
  currentUserId?: string
  currentRole?: UserRole
}
