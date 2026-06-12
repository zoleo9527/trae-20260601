export type UserRole = 'project_manager' | 'reviewer' | 'finance'

export type AssetStatus = 
  | 'pending_entry'
  | 'entry_completed'
  | 'pending_review'
  | 'review_approved'
  | 'review_rejected'
  | 'pending_finance'
  | 'finance_approved'
  | 'finance_rejected'
  | 'completed'

export type TaskType = 
  | 'asset_entry'
  | 'document_review'
  | 'deposit_refund'
  | 'qualification_dispute'
  | 'document_supplement'

export interface User {
  id: string
  name: string
  role: UserRole
  department: string
}

export interface Asset {
  id: string
  name: string
  code: string
  category: string
  location: string
  estimatedValue: number
  status: AssetStatus
  createdAt: string
  updatedAt: string
  submitter: User
  reviewer?: User
  financeHandler?: User
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: User
  assetId: string
}

export interface FlowRecord {
  id: string
  assetId: string
  statusFrom: AssetStatus
  statusTo: AssetStatus
  handler: User
  comment: string
  handledAt: string
}

export interface Task {
  id: string
  type: TaskType
  assetId: string
  assetName: string
  assetCode: string
  priority: 'high' | 'medium' | 'low'
  assignee: User
  createdAt: string
  dueDate?: string
  status: 'pending' | 'processing' | 'completed'
  relatedIssue?: string
}

export interface Notification {
  id: string
  type: 'task_assignment' | 'status_changed' | 'document_supplement' | 'deposit_refund'
  title: string
  content: string
  read: boolean
  createdAt: string
  assetId?: string
  userId?: string
}

export interface FilterParams {
  status?: AssetStatus
  keyword?: string
  category?: string
  assigneeId?: string
  dateRange?: [string, string]
}