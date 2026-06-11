export type UserRole = 'operations' | 'customer_service' | 'maintenance'
export type ComplaintType = 'monthly_rental_expired' | 'unlicensed_vehicle' | 'gate_malfunction'
export type ComplaintStatus = 'pending' | 'assigned' | 'processing' | 'appealing' | 'rejected' | 'closed'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
}

export interface Complaint {
  id: number
  complaint_no: string
  type: ComplaintType
  status: ComplaintStatus
  plate_number: string | null
  description: string
  appeal_reason: string | null
  appealed_at: string | null
  parking_lot_id: number
  gate_id: number | null
  gate_name: string | null
  incident_time: string | null
  assignee_id: number | null
  assignee_name: string | null
  created_at: string
  updated_at: string
  deadline: string
  is_overdue: boolean
}

export interface TimelineEvent {
  id: number
  complaint_id: number
  action: string
  operator_id: number
  operator_name: string
  operator_role: UserRole
  detail: string
  created_at: string
}

export interface ParkingLog {
  id: number
  plate_number: string | null
  direction: 'in' | 'out'
  gate_id: number
  gate_name: string
  timestamp: string
  image_url: string | null
  match_mode?: 'plate' | 'time_gate' | null
}

export interface GateAnomaly {
  id: number
  gate_id: number
  gate_name: string
  anomaly_type: 'stuck_open' | 'stuck_closed' | 'sensor_error' | 'force_open'
  detected_at: string
  resolved_at: string | null
  resolved_by: string | null
  impact_hours: number | null
  description: string
  match_mode?: 'time_gate' | null
}

export interface MonthlyRental {
  id: number
  plate_number: string
  owner_name: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'suspended'
  parking_lot_id: number
  last_renewed_at: string | null
}

export interface EvidenceLink {
  id: number
  complaint_id: number
  evidence_type: 'parking_log' | 'monthly_rental' | 'gate_anomaly'
  evidence_id: number
  linked_by: number
  linked_at: string
}

export type EvidenceReviewStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
export type EvidenceVerificationStatus = 'verified' | 'unverified' | 'insufficient'

export interface EvidenceReview {
  id: number
  complaint_id: number
  reviewer_id: number
  reviewer_name: string | null
  status: string
  blocked_reason: string | null
  completed_at: string | null
  notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ComplaintDetail extends Complaint {
  timeline: TimelineEvent[]
  evidence: {
    parking_logs: ParkingLog[]
    monthly_rentals: MonthlyRental[]
    gate_anomalies: GateAnomaly[]
  }
  evidence_review: EvidenceReview | null
  stuck_point: string | null
}

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  monthly_rental_expired: '月租权限失效',
  unlicensed_vehicle: '无牌车争议',
  gate_malfunction: '道闸故障',
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: '待处理',
  assigned: '已分配',
  processing: '处理中',
  appealing: '申诉中',
  rejected: '已退回',
  closed: '已关闭',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  operations: '运营专员',
  customer_service: '客服',
  maintenance: '设备维护员',
}

export const EVIDENCE_REVIEW_STATUS_LABELS: Record<EvidenceReviewStatus, string> = {
  pending: '待回查',
  in_progress: '回查中',
  completed: '已完成',
  blocked: '受阻',
}

export const EVIDENCE_VERIFICATION_STATUS_LABELS: Record<EvidenceVerificationStatus, string> = {
  verified: '已验证',
  unverified: '待验证',
  insufficient: '证据不足',
}

export const STUCK_POINT_LABELS: Record<string, string> = {
  unassigned: '尚未分配责任人',
  no_evidence: '证据回查未开始',
  evidence_blocked: '证据回查受阻',
  appeal_pending: '申诉待审核',
  overdue_processing: '处理超时',
  no_progress: '长时间无进展',
}
