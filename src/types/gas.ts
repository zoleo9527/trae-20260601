export type GasRole = 'safety_inspector' | 'customer_service' | 'repair_technician'

export type ApplicationStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'cancelled'

export type VisitStatus = 'pending' | 'completed' | 'failed' | 'pending_verify'

export type HiddenDangerLevel = 'critical' | 'major' | 'minor'

export type RecordStatus = 'pending' | 'in_progress' | 'completed'

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  meter_number: string
  gas_type: string
}

export interface GasApplication {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  application_type: 'stop' | 'resume' | 'temporary_stop'
  reason: string
  planned_date: string
  status: ApplicationStatus
  applicant: string
  applicant_role: GasRole
  approved_by?: string
  approved_at?: string
  executor?: string
  executed_at?: string
  completed_at?: string
  cancelled_by?: string
  cancelled_at?: string
  remark?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface CustomerVisit {
  id: string
  application_id?: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  visit_type: 'pre_visit' | 'post_visit' | 'follow_up'
  purpose: string
  status: VisitStatus
  visitor: string
  visitor_role: GasRole
  scheduled_date: string
  visited_at?: string
  contact_result?: 'reached' | 'not_reached' | 'refused'
  feedback?: string
  photos?: string[]
  remark?: string
  created_at: string
  updated_at: string
  application?: GasApplication
  customer?: Customer
}

export interface SafetyCheck {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  inspector: string
  check_date: string
  items: SafetyCheckItem[]
  overall_result: 'passed' | 'failed'
  remark?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface SafetyCheckItem {
  id: string
  check_id: string
  item_name: string
  standard: string
  actual: string
  passed: boolean
  remark?: string
}

export interface HiddenDanger {
  id: string
  check_id?: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  description: string
  level: HiddenDangerLevel
  status: RecordStatus
  notified_at?: string
  rectified_at?: string
  rectified_by?: string
  verify_result?: 'passed' | 'failed'
  remark?: string
  created_at: string
  updated_at: string
  check?: SafetyCheck
  customer?: Customer
}

export interface MeterChange {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  address: string
  old_meter_number: string
  new_meter_number: string
  meter_type: string
  change_date: string
  technician: string
  reason: string
  status: RecordStatus
  remark?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GasApplicationListQuery {
  status?: ApplicationStatus
  applicant_role?: GasRole
  customer_name?: string
  date_from?: string
  date_to?: string
}

export interface CustomerVisitListQuery {
  status?: VisitStatus
  visitor_role?: GasRole
  application_id?: string
  customer_name?: string
  date_from?: string
  date_to?: string
}

export interface SafetyCheckListQuery {
  inspector?: string
  customer_name?: string
  date_from?: string
  date_to?: string
}

export interface HiddenDangerListQuery {
  level?: HiddenDangerLevel
  status?: RecordStatus
  customer_name?: string
}

export interface MeterChangeListQuery {
  technician?: string
  customer_name?: string
  date_from?: string
  date_to?: string
}