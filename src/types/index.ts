export type Role = 'dispatcher' | 'technician' | 'customer_service'

export type OrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed'
  | 'rework_requested' 
  | 'rework_in_progress' 
  | 'rework_completed'
  | 'liability_pending' 
  | 'liability_done' 
  | 'resolved'

export type LiabilityResult = 
  | 'technician' 
  | 'customer' 
  | 'supplier' 
  | 'company'

export type PhotoType = 
  | 'before' 
  | 'during' 
  | 'after' 
  | 'leakage' 
  | 'rework'

export interface User {
  id: string
  name: string
  role: Role
  phone: string
}

export interface Accessory {
  id: string
  name: string
  quantity: number
  used: boolean
  installed: boolean
  remark: string
}

export interface InstallationPhoto {
  id: string
  order_id: string
  photo_url: string
  description: string
  photo_type: PhotoType
  uploaded_at: string
  uploaded_by: string
}

export interface AfterSalesRecord {
  id: string
  order_id: string
  type: 'leakage' | 'damage' | 'other'
  description: string
  photos: string[]
  reported_at: string
  reported_by: string
  status: 'pending' | 'processing' | 'resolved' | 'rejected'
  rejected_reason?: string
}

export interface ResponsibilityResult {
  id: string
  order_id: string
  responsible_party: LiabilityResult
  reason: string
  evidence: string[]
  created_at: string
  created_by: string
  status: 'confirmed' | 'appeal' | 'final'
  compensation_amount: number
}

export interface RejectionRecord {
  id: string
  liability_id: string
  order_id: string
  reason: string
  rejected_by: string
  rejected_at: string
  additional_evidence_required: string[]
  status: 'pending' | 'resolved'
}

export interface ProgressTracking {
  id: string
  order_id: string
  stage: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  operator_id: string
  operated_at: string
  notes: string
}

export interface Alert {
  id: string
  type: 'leakage' | 'timeout' | 'rejection' | 'pending_liability'
  order_id: string
  message: string
  severity: 'high' | 'medium' | 'low'
  created_at: string
  is_read: boolean
}

export interface Question {
  id: string
  order_id: string
  question: string
  asked_by: string
  asked_at: string
  answer?: string
  answered_by?: string
  answered_at?: string
}

export interface Order {
  id: string | number
  customer_name: string
  customer_phone: string
  address: string
  product_type: string
  product_model: string
  scheduled_time: string
  status: OrderStatus
  installer_id?: number
  installer_name?: string
  dispatcher_id?: number
  dispatcher_name?: string
  accessories: Accessory[]
  photos: InstallationPhoto[]
  after_sales_records: AfterSalesRecord[]
  responsibility_result?: ResponsibilityResult
  rejection_records: RejectionRecord[]
  progress_trackings: ProgressTracking[]
  questions: Question[]
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  phone: string
  password?: string
}

export interface LoginResponse {
  success: boolean
  user: User
}

export interface OrderCreateRequest {
  customer_name: string
  customer_phone: string
  address: string
  product_type: string
  product_model: string
  scheduled_time: string
}

export interface ResponsibilityJudgmentRequest {
  order_id: string
  responsible_party: LiabilityResult
  reason: string
  evidence: string[]
  compensation_amount: number
}

export interface RejectLiabilityRequest {
  reason: string
  additional_evidence_required: string[]
}

export interface AskQuestionRequest {
  question: string
}

export interface AnswerQuestionRequest {
  answer: string
}