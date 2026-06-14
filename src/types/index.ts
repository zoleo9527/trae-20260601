export type Role = 'manager' | 'risk_control' | 'post_loan'

export type Status = 
  | 'pending' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'supplement' 
  | 'urgent' 
  | 'completed'

export type RecordType = 'application' | 'risk_data' | 'collection'

export interface LoanApplication {
  id: string
  applicantName: string
  idCard: string
  phone: string
  amount: number
  term: number
  purpose: string
  createTime: string
  status: Status
}

export interface RiskData {
  id: string
  applicationId: string
  creditScore: number
  incomeVerification: boolean
  assetVerification: boolean
  debtRatio: number
  riskLevel: 'low' | 'medium' | 'high'
  reviewNote: string
  createTime: string
}

export interface CollectionRecord {
  id: string
  applicationId: string
  contactTime: string
  contactResult: 'success' | 'failed' | 'pending'
  collector: string
  note: string
}

export interface QuotaSuggestion {
  id: string
  applicationId: string
  suggestedAmount: number
  suggestedRate: number
  suggestedTerm: number
  reason: string
  reviewer: string
  reviewTime: string
  status: Status
}

export interface WorkflowRecord {
  id: string
  applicationId: string
  action: string
  operator: string
  operateTime: string
  note: string
  statusBefore: Status
  statusAfter: Status
}

export interface User {
  id: string
  name: string
  role: Role
  department: string
}
