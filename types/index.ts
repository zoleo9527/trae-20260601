export type Role = 'guide' | 'engineer' | 'activity_teacher'

export type FeedbackStatus = 
  | 'pending' 
  | 'guide_processing' 
  | 'guide_completed' 
  | 'engineer_processing' 
  | 'engineer_completed' 
  | 'activity_processing' 
  | 'activity_completed' 
  | 'resolved' 
  | 'closed'

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'verified'

export type InspectionStatus = 'normal' | 'warning' | 'error'

export type ScheduleStatus = 'available' | 'full' | 'cancelled' | 'conflict'

export type MaterialStatus = 'normal' | 'low' | 'out'

export interface StatusHistory {
  id: string
  status: string
  role: Role
  assignee: string
  remark: string
  createdAt: string
}

export interface RectificationTask {
  id: string
  title: string
  description: string
  feedbackId: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  role: Role
  assignee: string
  deadline: string
  createdAt: string
  completedAt?: string
  progress: number
  remark?: string
  history: StatusHistory[]
}

export interface Feedback {
  id: string
  title: string
  content: string
  type: 'suggestion' | 'complaint' | 'question' | 'praise' | 'fault'
  status: FeedbackStatus
  priority: 'low' | 'medium' | 'high'
  visitorName: string
  visitorContact: string
  exhibitionId?: string
  exhibitionName?: string
  createdAt: string
  updatedAt: string
  images?: string[]
  tags: string[]
  currentRole: Role
  currentAssignee: string
  history: StatusHistory[]
  tasks: RectificationTask[]
  relatedInspectionId?: string
  relatedScheduleId?: string
  relatedMaterialId?: string
}

export interface InspectionItem {
  id: string
  name: string
  location: string
  category: string
  status: InspectionStatus
  lastInspectionDate: string
  nextInspectionDate: string
  inspector: string
  issues: number
  lastRemark?: string
  relatedFeedbackId?: string
}

export interface ScheduleItem {
  id: string
  title: string
  guideName: string
  date: string
  startTime: string
  endTime: string
  location: string
  maxVisitors: number
  currentVisitors: number
  status: ScheduleStatus
  description: string
  conflictInfo?: string
  relatedFeedbackId?: string
}

export interface MaterialItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  status: MaterialStatus
  location: string
  lastUpdated: string
  lastRemark?: string
  relatedFeedbackId?: string
}

export interface RoleStats {
  role: Role
  roleName: string
  pendingCount: number
  processingCount: number
  completedCount: number
}

export interface DashboardStats {
  totalFeedback: number
  pendingFeedback: number
  resolvedFeedback: number
  resolutionRate: number
  activeTasks: number
  completedTasks: number
  inspectionItems: number
  normalItems: number
  todaySchedules: number
  totalVisitors: number
  materialsCount: number
  lowStockCount: number
  roleStats: RoleStats[]
}

export interface MenuItem {
  name: string
  path: string
  icon: string
  badge?: number
}

export interface TransferOption {
  toRole: Role
  toRoleName: string
  action: string
}
