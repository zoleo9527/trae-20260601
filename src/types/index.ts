export type Role = 'socialWorker' | 'volunteerLeader' | 'communityLeader'

export type VisitStatus = 'pending' | 'completed' | 'overdue' | 'blocked'

export type IssueStatus = 'pending' | 'processing' | 'resolved' | 'escalated'

export interface User {
  id: string
  name: string
  role: Role
  phone: string
  department: string
}

export interface KeyPerson {
  id: string
  name: string
  age: number
  address: string
  phone: string
  type: string
  careLevel: 'high' | 'medium' | 'low'
  description: string
}

export interface VisitRecord {
  id: string
  keyPersonId: string
  keyPerson: KeyPerson
  socialWorkerId: string
  socialWorkerName: string
  scheduledDate: string
  actualDate?: string
  status: VisitStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Issue {
  id: string
  visitId: string
  visitRecord?: VisitRecord
  reporterId: string
  reporterName: string
  title: string
  description: string
  category: string
  status: IssueStatus
  assignedTo?: string
  assignedName?: string
  createdAt: string
  updatedAt: string
  escalationReason?: string
}

export interface SystemStats {
  totalVisits: number
  pendingVisits: number
  overdueVisits: number
  blockedVisits: number
  totalIssues: number
  pendingIssues: number
  processingIssues: number
  resolvedIssues: number
  escalatedIssues: number
}
