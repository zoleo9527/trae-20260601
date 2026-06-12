export type UserRole = 'manager' | 'director' | 'engineer'

export interface User {
  id: string
  name: string
  role: UserRole
  department: string
}

export type AcceptanceStatus = 
  | 'draft'           
  | 'pending_engineer' 
  | 'engineer_rejected' 
  | 'pending_director'  
  | 'director_rejected' 
  | 'completed'         

export interface AcceptanceRecord {
  id: string
  enterpriseName: string
  contractNo: string
  floor: string
  roomNumber: string
  area: number
  contractDate: string
  plannedMoveInDate: string
  
  managerId: string
  managerName: string
  submitTime: string | null
  
  engineerId: string | null
  engineerName: string | null
  engineerAcceptTime: string | null
  engineerResult: 'pass' | 'reject' | null
  engineerRemark: string | null
  rejectReason: string | null
  
  directorId: string | null
  directorName: string | null
  directorConfirmTime: string | null
  directorResult: 'pass' | 'reject' | null
  directorRemark: string | null
  directorRejectReason: string | null
  feeStartDate: string | null
  
  supplementRemark: string | null
  
  status: AcceptanceStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAcceptancePayload {
  enterpriseName: string
  contractNo: string
  floor: string
  roomNumber: string
  area: number
  contractDate: string
  plannedMoveInDate: string
  supplementRemark?: string
}

export interface EngineerProcessPayload {
  recordId: string
  result: 'pass' | 'reject'
  rejectReason?: string
  engineerRemark?: string
}

export interface DirectorProcessPayload {
  recordId: string
  result: 'pass' | 'reject'
  feeStartDate?: string
  directorRemark?: string
  directorRejectReason?: string
}
