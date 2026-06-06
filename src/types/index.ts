export type Role = 'frontline' | 'manager' | 'admin'

export type InventoryStatus = 'pending' | 'in_progress' | 'resolved' | 'escalated'
export type ScreeningStatus = 'normal' | 'hall_changed' | 'equipment_failure' | 'refund_issue' | 'completed'
export type TodoPriority = 'high' | 'medium' | 'low'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type ExceptionStatus = 'pending' | 'handling' | 'resolved'
export type ExceptionType = 'hall_change' | 'group_ticket' | 'equipment_failure' | 'refund' | 'inventory'

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export interface Remark {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: Role
  createdAt: string
  type: 'inventory' | 'screening' | 'exception'
  sourceId: string
  syncedTo?: string[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  sourceType: 'inventory' | 'screening' | 'exception'
  sourceId: string
  syncedTo?: string[]
}

export interface InventoryItem {
  id: string
  productName: string
  sku: string
  currentStock: number
  expectedStock: number
  discrepancy: number
  status: InventoryStatus
  category: string
  unit: string
  lastCountTime: string
  handlerId?: string
  handlerName?: string
  remarks: Remark[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
  relatedScreeningIds: string[]
}

export interface Screening {
  id: string
  movieName: string
  startTime: string
  endTime: string
  originalHall: string
  currentHall: string
  totalTickets: number
  soldTickets: number
  groupTickets: number
  groupRedeemed: number
  status: ScreeningStatus
  isHallChanged: boolean
  hasEquipmentFailure: boolean
  refundCount: number
  remarks: Remark[]
  attachments: Attachment[]
  operatorId?: string
  operatorName?: string
  createdAt: string
  updatedAt: string
  inventoryIds: string[]
  syncedRemarks: string[]
  syncedAttachments: string[]
}

export interface TodoItem {
  id: string
  title: string
  description: string
  priority: TodoPriority
  assigneeId: string
  assigneeName: string
  dueTime: string
  completed: boolean
  relatedType?: 'inventory' | 'screening' | 'exception'
  relatedId?: string
  createdAt: string
}

export interface RiskItem {
  id: string
  title: string
  description: string
  level: RiskLevel
  status: 'open' | 'mitigating' | 'resolved'
  relatedType?: 'inventory' | 'screening'
  relatedId?: string
  createdAt: string
  resolvedAt?: string
}

export interface OperationLog {
  id: string
  action: string
  description: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  targetType: 'inventory' | 'screening' | 'exception' | 'user'
  targetId: string
  timestamp: string
  changes?: Record<string, { old: unknown; new: unknown }>
}

export interface ExceptionRecord {
  id: string
  type: ExceptionType
  title: string
  description: string
  screeningId?: string
  inventoryId?: string
  status: ExceptionStatus
  handlerId?: string
  handlerName?: string
  remarks: Remark[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  [key: string]: Permission[]
}
