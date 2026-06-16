export interface User {
  id: number
  username: string
  name: string
  role: 'clerk' | 'manager' | 'buyer'
  store_id: number
  store_name?: string
}

export interface LoginResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  error?: {
    code: string
    message: string
  }
}

export interface Coupon {
  id: number
  coupon_code: string
  policy_id: number
  policy?: Policy
  member_id: number
  member?: Member
  store_id: number
  store?: Store
  operator_id: number
  operator?: User
  status: 'draft' | 'pending_review' | 'issued' | 'verified' | 'archived' | 'rejected'
  issue_date?: string
  expiry_date?: string
  batch_id?: number
  batch?: Batch
  issue_remarks?: string
  review_remarks?: string
  attachments?: Attachment[]
  history?: OperationLog[]
  created_at: string
  updated_at: string
}

export interface Policy {
  id: number
  name: string
  description?: string
  discount_amount: number
  start_date?: string
  end_date?: string
  status: 'active' | 'inactive'
}

export interface Member {
  id: number
  name: string
  phone: string
  baby_name?: string
  baby_birthday?: string
  tier: 'normal' | 'silver' | 'gold' | 'platinum'
  points: number
  created_at: string
}

export interface Store {
  id: number
  name: string
  address?: string
}

export interface Batch {
  id: number
  batch_number: string
  supplier?: string
  production_date?: string
  expiry_date?: string
  quantity: number
  status: 'normal' | 'expiring' | 'expired'
}

export interface Attachment {
  id: number
  coupon_id: number
  filename: string
  file_path: string
  file_type?: string
  file_size?: number
  created_at: string
}

export interface OperationLog {
  id: number
  coupon_id: number
  user_id: number
  user?: User
  action: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface DashboardTodo {
  type: string
  title?: string
  description?: string
  responsible_role?: string
  count: number
  items?: Array<{
    coupon_id: number
    coupon_code: string
    member_name: string
    issue_date: string
    operator_name?: string
    waiting_time?: string
  }>
}

export interface DashboardRisk {
  type: string
  level: 'high' | 'medium' | 'low'
  count: number
  description: string
}

export interface DashboardRecent {
  coupon_id: number
  coupon_code: string
  action: string
  operator: string
  timestamp: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
