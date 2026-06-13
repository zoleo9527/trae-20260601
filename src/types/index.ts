export type UserRole = 'project_manager' | 'translator' | 'reviewer'

export type AssignmentStatus = 'pending' | 'assigned' | 'in_progress' | 'reviewing' | 'rejected' | 'completed'

export type TerminologyStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
}

export interface HistoryRecord {
  id: string
  action: string
  operator: string
  operatorRole: UserRole
  timestamp: string
  remark: string
  fromStatus?: string
  toStatus?: string
}

export interface Assignment {
  id: string
  projectName: string
  sourceLanguage: string
  targetLanguage: string
  translatorId: string
  translatorName: string
  reviewerId?: string
  reviewerName?: string
  status: AssignmentStatus
  deadline: string
  createdAt: string
  updatedAt: string
  history: HistoryRecord[]
  terminologyIds: string[]
  wordCount?: number
  description?: string
}

export interface TerminologyVersion {
  id: string
  sourceTerm: string
  targetTerm: string
  updatedBy: string
  updatedAt: string
  remark: string
}

export interface Terminology {
  id: string
  assignmentId: string
  sourceTerm: string
  targetTerm: string
  status: TerminologyStatus
  createdAt: string
  updatedAt: string
  versions: TerminologyVersion[]
  history: HistoryRecord[]
  context?: string
  note?: string
}