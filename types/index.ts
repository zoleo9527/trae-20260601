// 角色类型
export type UserRole = 'ticket_manager' | 'gate_staff' | 'customer_service'

// 用户信息
export interface User {
  id: string
  name: string
  role: UserRole
  department: string
  avatar?: string
}

// 票务类型
export type TicketType = 'adult' | 'child' | 'student' | 'group' | 'vip'
export type TicketStatus = 'valid' | 'used' | 'expired' | 'refunded' | 'changed'

// 票务记录
export interface Ticket {
  id: string
  ticketNo: string
  type: TicketType
  price: number
  purchaseTime: string
  validFrom: string
  validUntil: string
  status: TicketStatus
  touristName: string
  touristPhone: string
  idCardNo?: string
  gateId?: string
  usedAt?: string
}

// 退票/改期状态
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
export type RescheduleStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'

// 退票申请
export interface RefundRequest {
  id: string
  ticketId: string
  ticketNo: string
  touristName: string
  touristPhone: string
  refundReason: string
  refundAmount: number
  status: RefundStatus
  currentHandler: UserRole | null
  currentHandlerName: string | null
  handlerDepartment: string | null
  stuckPoint: string | null
  stuckReason: string | null
  createdAt: string
  updatedAt: string
  processingLogs: ProcessingLog[]
}

// 改期申请
export interface RescheduleRequest {
  id: string
  ticketId: string
  ticketNo: string
  touristName: string
  touristPhone: string
  originalDate: string
  newDate: string
  rescheduleReason: string
  status: RescheduleStatus
  currentHandler: UserRole | null
  currentHandlerName: string | null
  handlerDepartment: string | null
  stuckPoint: string | null
  stuckReason: string | null
  createdAt: string
  updatedAt: string
  processingLogs: ProcessingLog[]
}

// 投诉状态
export type ComplaintStatus = 'submitted' | 'assigned' | 'processing' | 'resolved' | 'closed'

// 投诉来源
export type ComplaintSource = 'phone' | 'online' | ' onsite' | 'third_party'

// 投诉等级
export type ComplaintLevel = 'low' | 'medium' | 'high' | 'urgent'

// 投诉记录
export interface Complaint {
  id: string
  complaintNo: string
  title: string
  description: string
  source: ComplaintSource
  level: ComplaintLevel
  status: ComplaintStatus
  relatedTicketId?: string
  relatedTicketNo?: string
  touristName: string
  touristPhone: string
  assignedTo: UserRole | null
  assignedToName: string | null
  currentHandler: UserRole | null
  currentHandlerName: string | null
  handlerDepartment: string | null
  stuckPoint: string | null
  stuckReason: string | null
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  processingLogs: ProcessingLog[]
}

// 处理日志
export interface ProcessingLog {
  id: string
  type: 'create' | 'assign' | 'process' | 'stuck' | 'resolve' | 'close' | 'comment'
  action: string
  operator: string
  operatorRole: UserRole
  operatorDepartment: string
  timestamp: string
  comment?: string
  attachments?: string[]
}

// 异常记录
export interface ExceptionRecord {
  id: string
  type: 'refund' | 'reschedule' | 'complaint' | 'gate_error'
  relatedId: string
  relatedNo: string
  exceptionType: string
  description: string
  status: 'open' | 'handling' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  createdBy: string
}

// 仪表盘统计数据
export interface DashboardStats {
  pendingRefunds: number
  pendingReschedules: number
  pendingComplaints: number
  todayProcessed: number
  stuckTasks: number
  urgentComplaints: number
}

// 任务追踪信息
export interface TaskTrackerInfo {
  taskId: string
  taskNo: string
  taskType: 'refund' | 'reschedule' | 'complaint'
  title: string
  currentHandler: UserRole | null
  currentHandlerName: string | null
  handlerDepartment: string | null
  status: string
  stuckPoint: string | null
  stuckReason: string | null
  createdAt: string
  updatedAt: string
  processingProgress: ProcessingProgress[]
}

export interface ProcessingProgress {
  stage: string
  handler: string
  handlerRole: UserRole
  handlerDepartment: string
  status: 'pending' | 'processing' | 'completed' | 'stuck'
  startTime?: string
  endTime?: string
  comment?: string
}

// 票种规则
export interface TicketRule {
  id: string
  ticketType: TicketType
  ruleName: string
  refundPolicy: string
  reschedulePolicy: string
  validDays: number
  description: string
}
