export type UserRole = 'customer_service' | 'housekeeper' | 'quality_supervisor' | 'admin'

export type OrderStatus = 
  | 'pending'
  | 'in_service'
  | 'feedback_submitted'
  | 'feedback_processing'
  | 'stuck'
  | 'completed'

export type FeedbackStatus = 
  | 'pending'
  | 'processing'
  | 'rejected'
  | 'supplemented'
  | 'completed'
  | 'stuck'

export type AdditionStatus = 
  | 'pending_confirmation'
  | 'confirmed'
  | 'rejected_by_housekeeper'
  | 'pending_approval'
  | 'approved'
  | 'rejected_by_supervisor'
  | 'in_progress'
  | 'completed'
  | 'incomplete'

export type FeedbackType = 'complaint' | 'suggestion' | 'issue' | 'addition_request'

export type ExceptionAction = 'reject' | 'supplement' | 'transfer' | 'complete' | 'mark_incomplete'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  online: boolean
}

export interface HandlerInfo {
  role: 'customer_service' | 'housekeeper' | 'quality_supervisor'
  name: string
  id: string
}

export interface StuckInfo {
  stuckAt: string
  stuckDuration: number
  stuckReason: string
}

export interface TimelineItem {
  id: string
  status: string
  timestamp: string
  handler?: HandlerInfo
  description: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  housekeeperId: string
  housekeeperName: string
  serviceType: string
  serviceDate: string
  status: OrderStatus
  currentHandler?: HandlerInfo
  stuckInfo?: StuckInfo
  createdAt: string
  updatedAt: string
}

export interface ProcessFeedback {
  id: string
  orderId: string
  submitterId: string
  submitterName: string
  submitterRole: 'housekeeper' | 'customer'
  content: string
  type: FeedbackType
  status: FeedbackStatus
  currentHandler?: HandlerInfo
  stuckInfo?: StuckInfo
  createdAt: string
  updatedAt: string
}

export interface AdditionHistoryItem {
  id: string
  action: string
  operatorId: string
  operatorName: string
  operatorRole: string
  reason?: string
  timestamp: string
}

export interface AdditionRecord {
  id: string
  orderId: string
  creatorId: string
  creatorName: string
  housekeeperId: string
  housekeeperName: string
  additionType: string
  additionContent: string
  estimatedCost: number
  status: AdditionStatus
  currentHandler?: HandlerInfo
  incompleteReason?: string
  history: AdditionHistoryItem[]
  createdAt: string
  updatedAt: string
}

export interface ExceptionHandle {
  id: string
  orderId: string
  feedbackId?: string
  additionId?: string
  handlerId: string
  handlerName: string
  handlerRole: string
  action: ExceptionAction
  reason: string
  result: string
  createdAt: string
}

export interface GetOrdersResponse {
  orders: Order[]
  total: number
  stuckCount: number
}

export interface GetOrderDetailResponse {
  order: Order
  timeline: TimelineItem[]
}

export interface GetFeedbackListResponse {
  feedbacks: ProcessFeedback[]
  total: number
  stuckCount: number
}

export interface HandleFeedbackRequest {
  feedbackId: string
  action: 'reject' | 'supplement' | 'complete' | 'transfer'
  reason: string
  supplementData?: Record<string, unknown>
  transferTo?: string
}

export interface GetAdditionRecordsResponse {
  records: AdditionRecord[]
  total: number
  incompleteCount: number
}

export interface HandleAdditionRequest {
  recordId: string
  action: 'confirm' | 'reject' | 'approve' | 'complete' | 'mark_incomplete'
  reason?: string
}

export interface HandleExceptionRequest {
  targetType: 'order' | 'feedback' | 'addition'
  targetId: string
  action: ExceptionAction
  reason: string
  transferTo?: string
  supplementData?: Record<string, unknown>
}

export interface GetExceptionHistoryResponse {
  handles: ExceptionHandle[]
}