export interface Inventory {
  id: string
  name: string
  category: string
  grade: string
  market_price: number
  quantity: number
  unit: string
}

export interface Customer {
  id: string
  name: string
  contact: string
}

export type AdjustmentType = 'market_change' | 'customer_negotiation' | 'grade_change'
export type AdjustmentStatus = 'pending' | 'approved' | 'rejected' | 'expired'

export interface PriceAdjustment {
  id: string
  inventory_id: string
  original_price: number
  new_price: number
  adjustment_type: AdjustmentType
  reason: string | null
  requested_lock_days: number | null
  customer_id: string
  applicant_name: string
  status: AdjustmentStatus
  review_opinion: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  inventoryName?: string
  inventoryCategory?: string
  inventoryGrade?: string
  inventoryUnit?: string
  inventoryQuantity?: number
  customerName?: string
  customerContact?: string
}

export type LockStatus = 'active' | 'expiring_soon' | 'expired'

export interface PriceLock {
  id: string
  adjustment_id: string
  inventory_id: string
  locked_price: number
  original_market_price: number
  quantity: number
  unit: string
  customer_id: string
  lock_start_date: string
  lock_end_date: string
  status: LockStatus
  inventoryName?: string
  customerName?: string
  remainingDays?: number
}

export type QuoteStatus = 'active' | 'expired' | 'rejected'

export interface CustomerQuote {
  id: string
  customer_id: string
  inventory_id: string
  quoted_price: number
  market_price: number
  adjustment_type: AdjustmentType
  status: QuoteStatus
  created_at: string
  expires_at: string | null
  inventoryName?: string
  inventoryCategory?: string
  inventoryGrade?: string
  inventoryUnit?: string
  customerName?: string
  customerContact?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
