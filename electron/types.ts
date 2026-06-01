export type UserRole = 'sales' | 'designer' | 'production' | 'admin'

export type OrderStatus = 
  | 'pending_quote' 
  | 'quoted' 
  | 'customer_approved' 
  | 'pending_proof' 
  | 'proof_uploaded' 
  | 'proof_rejected' 
  | 'proof_approved' 
  | 'pending_schedule' 
  | 'scheduled' 
  | 'in_production' 
  | 'completed' 
  | 'cancelled'

export type ProofStatus = 'pending' | 'uploaded' | 'approved' | 'rejected'

export type MachineStatus = 'idle' | 'running' | 'maintenance' | 'offline'

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'interrupted'

export type Urgency = 'normal' | 'urgent' | 'emergency'

export interface Customer {
  id: number
  name: string
  contact: string
  phone: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_no: string
  customer_id: number
  customer_name: string
  product_name: string
  quantity: number
  size: string
  paper_type: string
  paper_gsm: number
  color: string
  finish: string
  urgency: Urgency
  status: OrderStatus
  quote_amount?: number
  quote_note?: string
  quoted_at?: string
  quoted_by?: number
  deadline: string
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  description: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Proof {
  id: number
  order_id: number
  version: number
  file_path?: string
  file_name?: string
  status: ProofStatus
  uploaded_by: number
  uploaded_at: string
  reviewed_by?: number
  reviewed_at?: string
  feedback?: string
  is_current: boolean
}

export interface Machine {
  id: number
  name: string
  model: string
  type: string
  max_speed: number
  status: MachineStatus
  status_note?: string
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
}

export interface Schedule {
  id: number
  order_id: number
  machine_id: number
  start_time: string
  end_time: string
  actual_start?: string
  actual_end?: string
  status: ScheduleStatus
  priority: number
  notes?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  real_name: string
  role: UserRole
  password_hash: string
  created_at: string
  last_login?: string
}

export interface WorkspaceState {
  current_role: UserRole
  current_view: string
  selected_order_id?: number
  selected_machine_id?: number
  filter_date_from?: string
  filter_date_to?: string
  search_query: string
  sidebar_collapsed: boolean
  last_updated: string
}

export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface QuoteCalculationInput {
  quantity: number
  paper_type: string
  paper_gsm: number
  size: string
  color: string
  finish: string
  urgency: Urgency
}

export interface QuoteResult {
  base_cost: number
  paper_cost: number
  printing_cost: number
  finish_cost: number
  urgency_surcharge: number
  total: number
  unit_price: number
}
