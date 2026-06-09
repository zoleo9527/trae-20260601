export type ContainerType = '20GP' | '40GP' | '40HC' | '20RF'
export type ContainerStatus = 'normal' | 'overstay' | 'inspecting' | 'departed' | 'disputed' | 'misplaced'
export type YardSlotStatus = 'empty' | 'occupied' | 'overstay' | 'inspecting' | 'misplaced'
export type GateDirection = 'in' | 'out'
export type AnomalyType = 'none' | 'doc_mismatch' | 'container_damaged' | 'overdue_pickup'
export type OverstayStatus = 'pending_notify' | 'notified' | 'processing' | 'closed'
export type FeeReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'disputed'
export type ReviewAction = 'submit_review' | 'approve' | 'reject' | 'dispute' | 'adjust'
export type UserRole = 'gate_operator' | 'dispatcher' | 'customer_service'
export type InspectionStatus = 'planned' | 'in_progress' | 'completed'
export type NotifiedStatus = 'not_notified' | 'notified'

export interface Container {
  id: string
  container_no: string
  type: ContainerType
  status: ContainerStatus
  customer_id: string
  customer_name: string
  gate_in_time: string
  gate_out_time: string | null
  yard_position: string | null
  free_days: number
  overstay_days: number
  created_at: string
  updated_at: string
}

export interface GateRecord {
  id: string
  container_id: string
  container_no: string
  direction: GateDirection
  gate_time: string
  operator_name: string
  anomaly: AnomalyType
  anomaly_note: string | null
  created_at: string
}

export interface YardSlot {
  id: string
  position: string
  zone: string
  row_num: number
  col_num: number
  tier: number
  container_id: string | null
  container_no: string | null
  status: YardSlotStatus
}

export interface OverstayRecord {
  id: string
  container_id: string
  container_no: string
  overstay_days: number
  status: OverstayStatus
  notified_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  customer_name?: string
  yard_position?: string | null
  container_type?: string
}

export interface FeeRecord {
  id: string
  container_id: string
  container_no: string
  customer_name: string
  base_fee: number
  overstay_fee: number
  total_fee: number
  review_status: FeeReviewStatus
  created_at: string
  updated_at: string
}

export interface ReviewEntry {
  id: string
  fee_record_id: string
  action: ReviewAction
  operator_name: string
  role: UserRole
  comment: string | null
  adjusted_amount: number | null
  created_at: string
}

export interface FeeRecordWithReviews extends FeeRecord {
  review_entries: ReviewEntry[]
}

export interface InspectionPlan {
  id: string
  container_id: string
  container_no: string
  planned_time: string
  notified_status: NotifiedStatus
  notified_at: string | null
  status: InspectionStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  container_id: string
  event_type: string
  operator_name: string
  role: string
  description: string
  metadata: string
  created_at: string
}

export interface Attachment {
  id: string
  container_id: string
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface DashboardStats {
  totalContainers: number
  overstayCount: number
  disputedCount: number
  inspectingCount: number
  misplacedCount: number
  pendingNotifyCount: number
  pendingFeeReviewCount: number
  missedNotificationCount: number
}
