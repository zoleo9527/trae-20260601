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

export interface DimensionReviewRecord {
  version: number
  originalDimension: Dimension
  reviewedDimension?: Dimension
  passed?: boolean
  note?: string
  reviewedBy?: string
  reviewedAt?: string
  supersededAt?: string
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
  dimensionReviewHistory: DimensionReviewRecord[]

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

export interface TodayTasks {
  pending: Order[]
  urgent: Order[]
  modified: Order[]
}

export const statusMap: Record<OrderStatus, { text: string; color: string }> = {
  pending_receipt: { text: '待接稿', color: 'orange' },
  receipt_completed: { text: '已接稿', color: 'blue' },
  pending_review: { text: '待复核', color: 'gold' },
  review_passed: { text: '复核通过', color: 'green' },
  review_rejected: { text: '复核驳回', color: 'red' },
  pending_print: { text: '待喷绘', color: 'purple' },
  printing: { text: '喷绘中', color: 'cyan' },
  pending_install: { text: '待安装', color: 'geekblue' },
  install_completed: { text: '安装完成', color: 'lime' },
  completed: { text: '已完成', color: 'default' },
}

export const roleMap: Record<UserRole, string> = {
  receiver: '接单员',
  designer: '设计师',
  installer: '安装队长',
}
