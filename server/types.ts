export type UserRole = 'receiver' | 'designer' | 'installer'

export type OrderStatus =
  | 'pending_receipt'
  | 'receipt_completed'
  | 'pending_review'
  | 'review_passed'
  | 'review_rejected'
  | 'pending_print'
  | 'printing'
  | 'pending_install'
  | 'install_completed'
  | 'completed'

export interface Dimension {
  width: number
  height: number
  unit: string
}

export interface Attachment {
  id: string
  name: string
  type: 'manuscript' | 'photo' | 'other'
  url: string
  uploadedAt: string
  uploadedBy: string
}

export interface HistoryNote {
  id: string
  timestamp: string
  operator: string
  role: UserRole
  action: string
  content: string
  orderId: string
}

export interface Order {
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  projectName: string
  createdAt: string
  updatedAt: string

  manuscriptReceived: boolean
  manuscriptReceivedAt?: string
  manuscriptReceivedBy?: string
  manuscriptContent?: string
  manuscriptVersion: number

  originalDimension: Dimension
  reviewedDimension?: Dimension
  dimensionReviewed?: boolean
  dimensionReviewedAt?: string
  dimensionReviewedBy?: string
  dimensionReviewNote?: string
  dimensionModified: boolean

  colorRequirement?: string
  colorConfirmed?: boolean
  colorConfirmedAt?: string

  installTime?: string
  installAddress?: string
  installTimeModified: boolean

  status: OrderStatus
  currentHandler: UserRole

  attachments: Attachment[]
  history: HistoryNote[]
}

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
