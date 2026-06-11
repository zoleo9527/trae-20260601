export type LeaseStatus =
  | 'lead_created'
  | 'lead_following'
  | 'plan_pending'
  | 'plan_rejected'
  | 'plan_approved'
  | 'contract_pending'
  | 'contract_rejected'
  | 'contract_approved'
  | 'decoration_pending'
  | 'decoration_approved'
  | 'completed'

export type Role = 'manager' | 'supervisor' | 'property_engineer'

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
  department: string
}

export interface StatusHistory {
  id: string
  fromStatus: LeaseStatus | null
  toStatus: LeaseStatus
  operator: User
  operatorRole: Role
  timestamp: string
  remark: string
  rejectReason?: string
}

export interface LeasePlan {
  monthlyRent: number
  rentUnit: string
  freeRentMonths: number
  freeRentRemark: string
  leaseYears: number
  depositMonths: number
  increaseRate: string
  paymentMethod: string
  decorationDays: number
  earlyTerminationPenalty: string
}

export interface ContractInfo {
  contractNo?: string
  signedDate?: string
  startDate?: string
  endDate?: string
  partyA: string
  partyB: string
  legalRepresentative: string
  signers: string[]
}

export interface DecorationInfo {
  applyDate?: string
  planSubmitDate?: string
  approvedDate?: string
  expectedStartDate?: string
  expectedCompleteDate?: string
  engineerInCharge?: string
  requirements: string[]
  risks: string[]
}

export interface LeaseRecord {
  id: string
  recordNo: string
  companyName: string
  contactName: string
  contactPhone: string
  contactPosition: string
  building: string
  floor: string
  room: string
  area: number
  industry: string
  intendedUse: string
  currentStatus: LeaseStatus
  plan: LeasePlan
  contract: ContractInfo
  decoration: DecorationInfo
  createUser: User
  createTime: string
  currentHandler?: User
  currentHandlerRole?: Role
  statusHistory: StatusHistory[]
  supplements: {
    id: string
    content: string
    author: User
    authorRole: Role
    timestamp: string
    attachments?: string[]
  }[]
}
