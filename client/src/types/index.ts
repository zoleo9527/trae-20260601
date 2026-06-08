export interface User {
  id: string
  username: string
  role: string
  displayName: string
}

export interface Patrol {
  id: string
  patrolDate: string
  area: string
  submitter: string
  submitTime: string
  status: string
  confirmer?: string
  confirmTime?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Exception {
  id: string
  patrolId?: string
  title: string
  exceptionType: string
  description: string
  severity: string
  submitter: string
  submitTime: string
  handler?: string
  handleTime?: string
  handleNote?: string
  confirmer?: string
  confirmTime?: string
  status: string
  attachments: string[]
  createdAt: string
  updatedAt: string
}

export interface Handover {
  id: string
  shiftDate: string
  fromRole: string
  fromUser: string
  toRole: string
  toUser: string
  pendingPatrolCount: number
  pendingExceptionCount: number
  notes: string
  status: string
  submitTime: string
  acceptTime?: string
  createdAt: string
}

export interface StatusLog {
  id: string
  recordType: string
  recordId: string
  fromStatus: string
  toStatus: string
  operator: string
  operateTime: string
  note?: string
}

export interface DashboardData {
  pendingPatrols: Patrol[]
  pendingExceptions: Exception[]
  recentLogs: StatusLog[]
  stats: {
    patrolToday: number
    exceptionToday: number
    pendingCount: number
  }
}
