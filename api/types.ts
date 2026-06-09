export type Role = 'sales_clerk' | 'warehouse' | 'after_sales' | 'director'

export interface Session {
  role: Role
  name: string
}

export type QualificationStatus = 'pending' | 'approved' | 'rejected' | 'expiring_soon' | 'expired'

export interface Qualification {
  id: string
  customer_name: string
  license_type: string
  license_no: string
  status: QualificationStatus
  submitted_by: string
  reviewed_by: string | null
  review_note: string | null
  expire_date: string
  created_at: string
  updated_at: string
}

export interface QualificationReviewLog {
  id: string
  qualification_id: string
  action: string
  operator: string
  role: Role
  note: string | null
  created_at: string
}

export type PurchaseStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'confirmed_out' | 'shipped' | 'completed'

export interface Purchase {
  id: string
  request_no: string
  customer_name: string
  qualification_id: string
  qualification_status: QualificationStatus
  total_amount: number
  status: PurchaseStatus
  created_by: string
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_name: string
  specification: string
  quantity: number
  unit_price: number
}

export interface PurchaseFlowLog {
  id: string
  purchase_id: string
  action: string
  operator: string
  role: Role
  note: string | null
  created_at: string
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
