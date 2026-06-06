export type Role = 'admin' | 'purchaser' | 'teacher'

export type PurchaseStatus = 
  | 'pending_acceptance' 
  | 'accepted' 
  | 'rejected' 
  | 'supplementing' 
  | 'supplement_submitted'
  | 'overdue' 
  | 'dispute_pending'
  | 'dispute_processing'
  | 'sample_pending'
  | 'sample_completed'
  | 'sample_confirmed'
  | 'completed'

export type SampleStatus = 'pending' | 'completed' | 'failed'

export type ExceptionType = 'reject' | 'supplement' | 'overdue' | 'dispute'

export type ProcessStepKey = 
  | 'purchase_created'
  | 'acceptance_pending'
  | 'acceptance_completed'
  | 'supplement_requested'
  | 'supplement_submitted'
  | 'sample_pending'
  | 'sample_completed'
  | 'sample_confirmed'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'completed'

export interface ProcessStep {
  key: ProcessStepKey
  label: string
  role: Role
  status: 'completed' | 'current' | 'pending' | 'error'
  timestamp?: string
  operatorName?: string
  remark?: string
}

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export interface PurchaseItem {
  id: string
  name: string
  quantity: number
  unit: string
  specification?: string
  price?: number
  batchNumber?: string
  productionDate?: string
  expiryDate?: string
}

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'pdf' | 'other'
  url: string
  uploadTime: string
  uploaderId: string
}

export interface AcceptanceRecord {
  id: string
  purchaseId: string
  operatorId: string
  operatorName: string
  action: 'accept' | 'reject' | 'supplement'
  remark?: string
  attachments?: Attachment[]
  timestamp: string
  resubmitCount?: number
}

export interface SampleRecord {
  id: string
  purchaseId: string
  operatorId: string
  operatorName: string
  sampleTime: string
  sampleQuantity: string
  storageLocation: string
  temperature?: string
  remark?: string
  attachments?: Attachment[]
  status: SampleStatus
  confirmedById?: string
  confirmedByName?: string
  confirmedAt?: string
}

export interface DisputeRecord {
  id: string
  purchaseId: string
  raisedById: string
  raisedByName: string
  description: string
  status: 'pending' | 'investigating' | 'resolved'
  mediatorId?: string
  mediatorName?: string
  resolution?: string
  resolutionType?: 'accept' | 'reject' | 'compromise'
  createdAt: string
  resolvedAt?: string
  comments?: ExceptionComment[]
}

export interface ExceptionRecord {
  id: string
  purchaseId: string
  type: ExceptionType
  initiatorId: string
  initiatorName: string
  handlerId?: string
  handlerName?: string
  description: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createdAt: string
  resolvedAt?: string
  resolution?: string
  comments?: ExceptionComment[]
}

export interface ExceptionComment {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  attachments?: Attachment[]
}

export interface PurchaseOrder {
  id: string
  orderNo: string
  supplierName: string
  deliveryTime: string
  expectedDeliveryTime: string
  items: PurchaseItem[]
  totalAmount?: number
  purchaserId: string
  purchaserName: string
  status: PurchaseStatus
  acceptanceRecords: AcceptanceRecord[]
  sampleRecord?: SampleRecord
  exceptions: ExceptionRecord[]
  dispute?: DisputeRecord
  currentHandlerId?: string
  currentHandlerName?: string
  currentHandlerRole?: Role
  deadline?: string
  remark?: string
  resubmitCount: number
  processSteps: ProcessStep[]
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  role: Role
  name: string
  actions: string[]
}

export const ROLE_PERMISSIONS: Record<Role, RolePermission> = {
  admin: {
    role: 'admin',
    name: '食堂管理员',
    actions: [
      'view_all_purchases',
      'process_acceptance',
      'reject_purchase',
      'request_supplement',
      'initiate_sample',
      'view_samples',
      'handle_exceptions',
      'resolve_disputes',
      'switch_role'
    ]
  },
  purchaser: {
    role: 'purchaser',
    name: '采购员',
    actions: [
      'view_my_purchases',
      'submit_supplement',
      'resubmit_acceptance',
      'respond_to_exceptions',
      'raise_dispute',
      'view_acceptance_status'
    ]
  },
  teacher: {
    role: 'teacher',
    name: '班主任',
    actions: [
      'view_purchases',
      'confirm_sample',
      'report_exceptions',
      'mediate_dispute',
      'participate_dispute'
    ]
  }
}
