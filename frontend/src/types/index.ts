export type UserRole = 'technician' | 'customer_service' | 'supervisor'

export interface User {
  id: string
  name: string
  role: UserRole
}

export type ReplacementStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'rejected'
  | 'resubmitted'
  | 'completed'
  | 'closed'

export interface ReplacementItem {
  partName: string
  partCode: string
  quantity: number
  unitPrice: number
}

export interface Replacement {
  id: string
  orderNo: string
  customerName: string
  phone: string
  elevatorNo: string
  deviceModel: string
  faultDescription: string
  replaceReason: string
  sceneDescription: string
  items: ReplacementItem[]
  estimatedAmount: number
  confirmedAmount?: number
  status: ReplacementStatus
  technicianId: string
  technicianName: string
  customerFeedback?: string
  remark?: string
  supplementNotes: string[]
  rejectReason?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  confirmedAt?: string
  closedAt?: string
  costConfirmations: CostConfirmation[]
  rejectRecords: RejectRecord[]
  attachments: Attachment[]
}

export interface ReplacementFilters {
  status?: ReplacementStatus
  keyword?: string
  dateRange?: {
    start: string
    end: string
  }
}

export type OperationAction =
  | 'create'
  | 'submit'
  | 'confirm'
  | 'confirm_cost'
  | 'cost_confirm'
  | 'reject'
  | 'resubmit'
  | 'supplement'
  | 'complete'
  | 'close'
  | 'assign'
  | 'transfer'
  | 'comment'
  | 'update'
  | 'add_supplement_note'

export interface OperationLog {
  id: string
  replacementId: string
  action: OperationAction
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  timestamp?: string
  operateTime?: string
  details?: Record<string, unknown>
  detail?: string
}

export type ElevatorStatus = 'normal' | 'fault' | 'maintenance' | 'inspection'

export interface Elevator {
  id: string
  registrationNo: string
  address: string
  floor: string
  station: string
  load: number
  speed: number
  manufacturer: string
  model: string
  installDate: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  lastInspectionDate: string
  nextInspectionDate: string
  status: ElevatorStatus
  customerId: string
}

export type CustomerLevel = 'A' | 'B' | 'C'

export interface Customer {
  id: string
  name: string
  contact: string
  phone: string
  address: string
  contractNo: string
  contractStartDate: string
  contractEndDate: string
  level: CustomerLevel
}

export type FaultStatus = 'pending' | 'dispatched' | 'processing' | 'resolved' | 'closed'

export interface FaultCall {
  id: string
  callNo: string
  elevatorId: string
  customerName: string
  faultDescription: string
  callerName: string
  callerPhone: string
  callTime: string
  dispatchTime?: string
  technicianId?: string
  technicianName?: string
  arrivalTime?: string
  resolveTime?: string
  faultCause?: string
  solution?: string
  status: FaultStatus
}

export type InspectionType = 'annual' | 'periodic' | 'special'
export type InspectionResult = 'passed' | 'failed' | 'conditional'

export interface InspectionDoc {
  id: string
  elevatorId: string
  customerName: string
  inspectionType: InspectionType
  inspectionDate: string
  inspectionAgency: string
  inspector: string
  result: InspectionResult
  expiryDate: string
  reportNo: string
  remark?: string
  attachments: string[]
}

export type MaintenanceType = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export interface MaintenancePlan {
  id: string
  elevatorId: string
  customerName: string
  planDate: string
  planType: MaintenanceType
  content: string
  technicianId: string
  technicianName: string
  status: MaintenanceStatus
  actualDate?: string
  remark?: string
}

export interface CostConfirmation {
  id: string
  role: UserRole
  confirmerId: string
  confirmerName: string
  confirmedAmount: number
  comment?: string
  confirmTime: string
}

export interface RejectRecord {
  id: string
  role: UserRole
  rejecterId: string
  rejecterName: string
  reason: string
  rejectTime: string
}

export interface SupplementNoteV2 {
  id: string
  authorId: string
  authorName: string
  content: string
  noteTime: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  uploadTime: string
  uploaderId: string
}

export interface PartReplacement {
  id: string
  elevatorId: string
  customerName: string
  partName: string
  partModel: string
  quantity: number
  unitPrice: number
  applyAmount: number
  replaceReason: string
  sceneDescription: string
  status: ReplacementStatus
  currentRole: UserRole
  currentOwner: string
  rejectCount: number
  submitterId: string
  submitterName: string
  submitTime: string
  lastUpdateTime: string
  costConfirmations: CostConfirmation[]
  rejectRecords: RejectRecord[]
  supplementNotes: SupplementNoteV2[]
  attachments: Attachment[]
}
