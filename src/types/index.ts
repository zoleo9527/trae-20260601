export type OrderStatus =
  | 'pending_design'
  | 'designing'
  | 'pending_qc'
  | 'qc_in_progress'
  | 'passed'
  | 'rejected'
  | 'pending_shipping'
  | 'shipped'
  | 'delivered'

export type ExceptionSeverity = 'high' | 'medium' | 'low'

export type ExceptionType = 'color_mismatch' | 'shape_issue' | 'bite_issue' | 'material_defect' | 'other'

export type RoleType = 'cs' | 'designer' | 'qc'

export interface Order {
  id: string
  patientName: string
  designType: string
  status: OrderStatus
  assignedCs: string
  assignedDesigner: string
  assignedQc: string
  createdAt: string
  updatedAt: string
  stuckAt?: string
  stuckDuration?: number
  rejectionReason?: string
}

export interface Exception {
  id: string
  orderId: string
  type: ExceptionType
  severity: ExceptionSeverity
  description: string
  triggeredBy: string
  triggeredAt: string
  notified: boolean
  resolved: boolean
}

export interface ShippingRecord {
  id: string
  orderId: string
  trackingNo: string
  carrier: string
  shippedAt?: string
  deliveredAt?: string
  assignedCs: string
  reason?: string
}

export interface Staff {
  id: string
  name: string
  role: RoleType
  avatar: string
  processingCount: number
  isOnline: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  duration?: number
}
