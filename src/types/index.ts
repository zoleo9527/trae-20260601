export type UserRole = 'sales_clerk' | 'warehouse' | 'after_sales'

export type OrderStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'warehousing'
  | 'fee_adjusting'
  | 'completed'

export type ReturnType = 'return' | 'exchange'

export type FeeAdjustmentStatus = 'pending' | 'approved' | 'rejected'

export interface Remark {
  id: string
  author: string
  role: UserRole
  content: string
  createdAt: string
}

export interface FeeAdjustment {
  id: string
  orderId: string
  adjustAmount: number
  adjustReason: string
  evidenceSummary: string
  screenshotThumbnails: string[]
  status: FeeAdjustmentStatus
  approvedBy: string
  createdAt: string
}

export interface ChatMessage {
  role: string
  content: string
}

export interface Order {
  id: string
  orderNo: string
  customerName: string
  productName: string
  quantity: number
  returnReason: string
  responsibleParty: string
  returnType: ReturnType
  status: OrderStatus
  isStuck: boolean
  stuckReason?: string
  stuckStep?: string
  assignedRole: UserRole
  feeAdjustment?: FeeAdjustment
  remarks: Remark[]
  chatMessages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  orderId: string
  action: string
  operator: string
  role: UserRole
  remark: string
  timestamp: string
}

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  sales_clerk: '销售内勤',
  warehouse: '仓库员',
  after_sales: '售后专员',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: '待审核',
  approved: '已审核',
  rejected: '已驳回',
  warehousing: '仓库处理中',
  fee_adjusting: '费用调整中',
  completed: '已完成',
}

export const FEE_STATUS_LABELS: Record<FeeAdjustmentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}
