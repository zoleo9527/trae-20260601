export type Role = 'gate' | 'cs' | 'engineer' | 'supervisor'

export interface User {
  id: number
  name: string
  role: Role
  enterprise_id: number | null
}

export interface Enterprise {
  id: number
  name: string
  contact_name: string
  contact_phone: string
  floor: string
}

export interface Employee {
  id: number
  enterprise_id: number
  name: string
  phone: string
  position: string
}

export interface Visitor {
  id: number
  enterprise_id: number
  host_employee_id: number
  name: string
  phone: string
  purpose: string
  visit_date: string
  status: 'pending' | 'arrived' | 'cancelled'
}

export interface AccessRecord {
  id: number
  visitor_id: number | null
  gate_no: string
  pass_type: 'normal' | 'temporary'
  direction: 'in' | 'out'
  verified_by: number
  note: string | null
  created_at: string
}

export interface RepairOrder {
  id: number
  enterprise_id: number
  reporter_id: number
  title: string
  description: string
  location: string
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'closed'
  deadline: string
  created_at: string
}

export interface WorkOrder {
  id: number
  repair_order_id: number
  engineer_id: number | null
  status: 'assigned' | 'accepted' | 'in_progress' | 'reassigned' | 'completed'
  assigned_at: string
  accepted_at: string | null
  completed_at: string | null
  note: string | null
}

export interface Evaluation {
  id: number
  repair_order_id: number
  rater_id: number
  rating: number
  comment: string | null
  created_at: string
}
