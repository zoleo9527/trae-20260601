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

export interface ScheduleWithDetails extends Schedule {
  order_no: string
  customer_name: string
  product_name: string
  quantity: number
  deadline: string
  urgency: Urgency
  order_status: OrderStatus
  machine_name: string
  machine_status: MachineStatus
}

export interface User {
  id: number
  username: string
  real_name: string
  role: UserRole
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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_quote: '待报价',
  quoted: '已报价',
  customer_approved: '客户已确认',
  pending_proof: '待打样',
  proof_uploaded: '打样已上传',
  proof_rejected: '打样被退回',
  proof_approved: '打样已确认',
  pending_schedule: '待排产',
  scheduled: '已排产',
  in_production: '生产中',
  completed: '已完成',
  cancelled: '已取消'
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_quote: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  quoted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  customer_approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending_proof: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  proof_uploaded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  proof_rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  proof_approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending_schedule: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  scheduled: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  in_production: 'bg-factory-accent/20 text-factory-accent border-factory-accent/30',
  completed: 'bg-factory-success/20 text-factory-success border-factory-success/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  normal: '普通',
  urgent: '加急',
  emergency: '特急'
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  normal: 'bg-gray-500/20 text-gray-400',
  urgent: 'bg-orange-500/20 text-orange-400',
  emergency: 'bg-red-500/20 text-red-400 animate-pulse'
}

export const PROOF_STATUS_LABELS: Record<ProofStatus, string> = {
  pending: '待上传',
  uploaded: '已上传',
  approved: '已确认',
  rejected: '已退回'
}

export const PROOF_STATUS_COLORS: Record<ProofStatus, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  uploaded: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400'
}

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  idle: '空闲',
  running: '运行中',
  maintenance: '维修中',
  offline: '离线'
}

export const MACHINE_STATUS_COLORS: Record<MachineStatus, string> = {
  idle: 'bg-green-500 text-green-100',
  running: 'bg-factory-accent text-white',
  maintenance: 'bg-yellow-500 text-yellow-100',
  offline: 'bg-gray-500 text-gray-100'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  sales: '业务员',
  designer: '设计',
  production: '生产主管',
  admin: '管理员'
}

export const WORKSPACE_VIEWS = {
  SALES_DASHBOARD: 'sales-dashboard',
  SALES_NEW_ORDER: 'sales-new',
  SALES_QUOTE: 'sales-quote',
  SALES_CUSTOMERS: 'sales-customers',
  DESIGNER_DASHBOARD: 'designer-dashboard',
  DESIGNER_ALL_PROOFS: 'designer-all',
  PRODUCTION_DASHBOARD: 'production-dashboard',
  PRODUCTION_MACHINES: 'production-machines',
  PRODUCTION_NEW_SCHEDULE: 'production-schedule',
} as const

export type WorkspaceView = typeof WORKSPACE_VIEWS[keyof typeof WORKSPACE_VIEWS]
