export interface Student {
  id: string
  name: string
  student_no: string
  building: string
  room: string
  phone?: string
  created_at: string
}

export interface Key {
  id: number
  key_number: string
  building: string
  room: string
  key_type: string
  status: 'available' | 'borrowed' | 'lost'
  current_holder?: string
  created_at: string
  updated_at: string
}

export interface BorrowRecord {
  id: number
  key_id: number
  student_id: string
  student_name: string
  borrower_role: string
  expected_return_time: string
  operator: string
  remark?: string
  borrow_time: string
  actual_return_time?: string
  is_overdue: boolean
}

export interface LostRecord {
  id: number
  key_id: number
  student_name: string
  lost_reason: string
  replace_fee?: number
  operator: string
  lost_time: string
  replace_time?: string
  new_key_id?: number
  status: 'lost' | 'replaced'
}

export interface OperationLog {
  id: number
  key_id?: number
  action: string
  operator: string
  operator_role: string
  detail?: string
  created_at: string
}

export interface DashboardStats {
  total_keys: number
  available_keys: number
  borrowed_keys: number
  lost_keys: number
  total_students: number
  active_borrows: number
  overdue_borrows: number
}

export interface RiskItem {
  key_id: number
  key_number: string
  building: string
  room: string
  risk_type: 'overdue' | 'lost'
  description: string
  level: 'high' | 'medium' | 'low'
}

export interface User {
  role: 'dorm_manager' | 'counselor' | 'maintenance'
  name: string
}
