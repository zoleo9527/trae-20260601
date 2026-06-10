export interface User {
  id: number
  username: string
  display_name: string
  role: 'customer_service' | 'picking_guide' | 'warehouse'
}

export interface FruitBatch {
  id: number
  batch_no: string
  fruit_type: string
  picking_date: string
  picking_area: string
  quantity_picked: number
  unit: string
  guide_name: string
  status: 'picked' | 'grading' | 'graded' | 'warehousing' | 'stored'
  created_at: string | null
  updated_at: string | null
}

export interface GradingRecord {
  id: number
  batch_id: number
  grade_a_qty: number
  grade_b_qty: number
  grade_c_qty: number
  grade_d_qty: number
  grader_name: string
  grading_notes: string
  status: 'pending' | 'confirmed'
  created_at: string | null
  updated_at: string | null
  batch?: FruitBatch
}

export interface InventoryItem {
  id: number
  fruit_type: string
  grade: string
  quantity: number
  unit: string
  warehouse_location: string
  updated_at: string | null
}

export interface InventoryChangeLog {
  id: number
  inventory_item_id: number
  change_type: string
  quantity_before: number
  quantity_after: number
  change_amount: number
  reason: string
  operator_name: string
  operator_role: string
  related_batch_no: string
  created_at: string | null
}

export interface Reservation {
  id: number
  visitor_name: string
  visitor_phone: string
  reserved_date: string
  fruit_type: string
  reserved_qty: number
  actual_qty: number
  status: 'pending' | 'confirmed' | 'completed'
  overbook_flag: number
  notes: string
  handler_name: string
  created_at: string | null
  updated_at: string | null
}

export interface Complaint {
  id: number
  visitor_name: string
  visitor_phone: string
  content: string
  category: string
  status: 'pending' | 'processing' | 'replied'
  handler_name: string
  reply_content: string
  related_reservation_id: number | null
  created_at: string | null
  updated_at: string | null
}

export interface PickingLoss {
  id: number
  batch_id: number
  expected_qty: number
  actual_qty: number
  loss_qty: number
  loss_rate: number
  loss_reason: string
  reporter_name: string
  created_at: string | null
  batch?: FruitBatch
}

export interface ProcessingLog {
  id: number
  entity_type: string
  entity_id: number
  action: string
  operator_name: string
  operator_role: string
  notes: string
  created_at: string | null
}

export interface DashboardStats {
  pending_grading: number
  pending_warehousing: number
  pending_complaints: number
  overbooked_reservations: number
  today_batches: number
  total_inventory_value: number
}

export interface PendingBatch {
  id: number
  batch_no: string
  fruit_type: string
  picking_date: string
  picking_area: string
  quantity_picked: number
  unit: string
  guide_name: string
  status: string
  has_grading: boolean
  grading_id: number | null
}

export const STATUS_LABELS: Record<string, string> = {
  picked: '已采摘',
  grading: '分级中',
  graded: '已分级',
  warehousing: '入库中',
  stored: '已入库',
  pending: '待处理',
  confirmed: '已确认',
  completed: '已完成',
  replied: '已回复',
  processing: '处理中',
}

export const GRADE_LABELS: Record<string, string> = {
  A: 'A级（优等）',
  B: 'B级（一等）',
  C: 'C级（二等）',
  D: 'D级（等外）',
}

export const ROLE_LABELS: Record<string, string> = {
  customer_service: '园区客服',
  picking_guide: '采摘向导',
  warehouse: '仓库员',
}
