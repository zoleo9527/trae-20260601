export type Role = 'doctor' | 'nurse' | 'receptionist'

export interface Patient {
  id: number
  name: string
  species: string
  breed: string
  age: string
  owner_name: string
  owner_phone: string
  admit_date: string
  diagnosis: string
  status: 'hospitalized' | 'discharged'
  cage_number: string
  condition_trend?: 'improving' | 'stable' | 'worsening'
  pending_tasks?: number
  abnormal_count?: number
  pending_followups?: number
}

export interface CareRecord {
  id: number
  patient_id: number
  type: 'medication' | 'dressing' | 'feeding' | 'iv_fluid' | 'observation' | 'vitals' | 'other'
  content: string
  scheduled_at: string
  executed_at?: string | null
  executed_by?: string | null
  is_abnormal: number
  abnormal_note?: string | null
  status: 'pending' | 'completed' | 'missed' | 'delayed'
  patient_name?: string
  cage_number?: string
  species?: string
}

export interface Order {
  id: number
  patient_id: number
  type: 'medication' | 'nursing' | 'examination'
  content: string
  frequency: string
  prescribed_by: string
  prescribed_at: string
  is_active: number
}

export interface Followup {
  id: number
  patient_id: number
  scheduled_date: string
  status: 'pending' | 'confirmed' | 'completed' | 'overdue' | 'rescheduled'
  reason: string
  notes?: string | null
  patient_name?: string
  owner_name?: string
  owner_phone?: string
  species?: string
  breed?: string
}

export interface Communication {
  id: number
  patient_id: number
  contact_at: string
  method: 'phone' | 'wechat' | 'in_person'
  content: string
  contacted_by: string
  result: string
}
