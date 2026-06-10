export type UserRole = 'technician' | 'customer_service' | 'project_manager'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  phone: string
  department: string
}

export type InspectionStatus = 
  | 'pending'        // 待处理
  | 'under_review'   // 审核中
  | 'non_compliant'  // 不合格（需整改）
  | 'compliant'      // 合格
  | 'rectifying'     // 整改中
  | 'closed'         // 已闭环

export type RectificationStatus =
  | 'pending'        // 待整改
  | 'in_progress'    // 整改中
  | 'recheck'        // 待复查
  | 'passed'         // 复查通过
  | 'failed'         // 复查未通过
  | 'closed'         // 已闭环

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

export type AlertType = 
  | 'deadline'       // 期限预警
  | 'recheck'        // 复检提醒
  | 'non_compliant'  // 不合格通知
  | 'rectification'  // 整改派单
  | 'system'         // 系统通知

export interface InspectionCriterion {
  id: string
  code: string
  category: string
  name: string
  standard: string
  method: string
  isRequired: boolean
}

export interface InspectionItemResult {
  criterionId: string
  result: 'pass' | 'fail' | 'na'
  evidence?: string
  note?: string
  photos?: string[]
}

export interface InspectionRecord {
  id: string
  elevatorId: string
  elevatorName: string
  location: string
  inspectionDate: string
  inspector: string
  status: InspectionStatus
  items: InspectionItemResult[]
  failItems: string[]
  failReasons: string[]
  conclusion?: string
  rectificationDeadline?: string
  createdAt: string
  updatedAt: string
  attachments?: string[]
}

export interface RectificationRecord {
  id: string
  inspectionId: string
  elevatorId: string
  elevatorName: string
  location: string
  status: RectificationStatus
  priority: PriorityLevel
  failItems: string[]
  originalReasons: string[]
  assignedTo: string
  assigneeRole: UserRole
  deadline: string
  rectificationMeasures: RectificationMeasure[]
  recheckResults?: RecheckResult[]
  closedAt?: string
  closedBy?: string
  createdAt: string
  updatedAt: string
}

export interface RectificationMeasure {
  id: string
  itemId: string
  itemName: string
  originalProblem: string
  measure: string
  operator: string
  completedAt: string
  photos?: string[]
  remark?: string
}

export interface RecheckResult {
  id: string
  rechecker: string
  recheckerRole: UserRole
  recheckDate: string
  result: 'pass' | 'fail'
  items: {
    itemId: string
    itemName: string
    result: 'pass' | 'fail'
    note?: string
  }[]
  overallConclusion: string
}

export interface TodoItem {
  id: string
  type: 'inspection' | 'rectification' | 'recheck' | 'review'
  title: string
  description: string
  relatedId: string
  priority: PriorityLevel
  deadline: string
  assignedBy?: string
  createdAt: string
}

export interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  relatedId?: string
  relatedType?: string
  priority: PriorityLevel
  isRead: boolean
  createdAt: string
}

export interface TimelineEvent {
  id: string
  timestamp: string
  actor: string
  actorRole: UserRole
  action: string
  detail?: string
}
