export type PlanStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'suspended'

export type PhaseStatus = 'not_started' | 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'supplemented'

export type EvaluationStatus = 'pending' | 'completed' | 'delayed' | 'rejected' | 'pending_review'

export type StaffRole = 'nursing_director' | 'primary_nurse' | 'social_worker'

export type TimelineType = 'create' | 'update' | 'evaluation' | 'status_change' | 'exception' | 'review'

export interface Staff {
  id: string
  name: string
  role: StaffRole
  phone: string
}

export interface Elder {
  id: string
  name: string
  bedNumber: string
  roomNumber: string
  age: number
  gender: 'male' | 'female'
  primaryDisease: string
}

export interface Phase {
  id: string
  planId: string
  phaseNumber: number
  title: string
  target: string
  content: string
  startDate: string
  endDate: string
  status: PhaseStatus
  evaluatorId?: string
  evaluationDate?: string
  evaluationResult?: string
  evaluationScore?: number
  rejectReason?: string
  isDelayed: boolean
  isSupplemented: boolean
}

export interface RehabPlan {
  id: string
  elderId: string
  elder: Elder
  title: string
  description: string
  startDate: string
  expectedEndDate: string
  actualEndDate?: string
  status: PlanStatus
  phases: Phase[]
  nursingDirectorId?: string
  nursingDirector?: Staff
  primaryNurseId?: string
  primaryNurse?: Staff
  socialWorkerId?: string
  socialWorker?: Staff
  createdAt: string
  updatedAt: string
  hasException: boolean
  exceptionReason?: string
}

export interface TimelineEvent {
  id: string
  planId: string
  type: TimelineType
  title: string
  description: string
  operatorId: string
  operatorName: string
  operatorRole: StaffRole
  timestamp: string
  phaseId?: string
  phaseNumber?: number
}

export interface ExceptionRecord {
  id: string
  planId: string
  phaseId?: string
  type: 'delay' | 'reject' | 'supplement' | 'suspend'
  title: string
  reason: string
  handlerId?: string
  handlerName?: string
  status: 'pending' | 'processing' | 'resolved'
  createdAt: string
  resolvedAt?: string
  resolution?: string
}
