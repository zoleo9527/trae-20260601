export type RoleKey = 'manager' | 'supervisor' | 'superintendent'

export interface Role {
  key: RoleKey
  label: string
  user: string
}

export const ROLES: Role[] = [
  { key: 'manager', label: '柜长', user: '王芳' },
  { key: 'supervisor', label: '楼层主管', user: '李明' },
  { key: 'superintendent', label: '品牌督导', user: '张伟' }
]

export type ComplaintStatus =
  | 'draft'
  | 'pending_supervisor'
  | 'returned_to_manager'
  | 'resubmitted'
  | 'pending_brand'
  | 'brand_feedback'
  | 'returned_to_supervisor'
  | 'rechecked'
  | 'completed'
  | 'cancelled'

export interface StatusConfig {
  key: ComplaintStatus
  label: string
  color: string
  bgColor: string
}

export const STATUS_CONFIG: Record<ComplaintStatus, StatusConfig> = {
  draft: { key: 'draft', label: '草稿', color: '#718096', bgColor: '#edf2f7' },
  pending_supervisor: { key: 'pending_supervisor', label: '待楼层主管处理', color: '#c05621', bgColor: '#feebc8' },
  returned_to_manager: { key: 'returned_to_manager', label: '已退回柜长补录', color: '#c53030', bgColor: '#fed7d7' },
  resubmitted: { key: 'resubmitted', label: '已补录重提', color: '#b7791f', bgColor: '#fefcbf' },
  pending_brand: { key: 'pending_brand', label: '待品牌反馈', color: '#2b6cb0', bgColor: '#bee3f8' },
  brand_feedback: { key: 'brand_feedback', label: '品牌已反馈', color: '#2f855a', bgColor: '#c6f6d5' },
  returned_to_supervisor: { key: 'returned_to_supervisor', label: '已退回主管复核', color: '#d69e2e', bgColor: '#fefcbf' },
  rechecked: { key: 'rechecked', label: '已复核通过', color: '#276749', bgColor: '#c6f6d5' },
  completed: { key: 'completed', label: '处理完成', color: '#1a365d', bgColor: '#e2e8f0' },
  cancelled: { key: 'cancelled', label: '已取消', color: '#718096', bgColor: '#edf2f7' }
}

export type ComplaintType = 'refund' | 'exchange' | 'repair' | 'other'

export const COMPLAINT_TYPE_CONFIG: Record<ComplaintType, string> = {
  refund: '退款',
  exchange: '换货',
  repair: '维修',
  other: '其他'
}

export type ResponsibilityParty = 'customer' | 'brand' | 'store' | 'unclear'

export const RESPONSIBILITY_CONFIG: Record<ResponsibilityParty, string> = {
  customer: '顾客责任',
  brand: '品牌责任',
  store: '专柜责任',
  unclear: '待界定'
}

export interface OperationLog {
  id: string
  timestamp: string
  operator: string
  role: RoleKey
  action: string
  remark: string
  attachments?: string[]
}

export interface BrandFeedback {
  id: string
  timestamp: string
  operator: string
  feedbackContent: string
  responsibility: ResponsibilityParty
  handlingSuggestion: string
  attachments?: string[]
}

export interface Complaint {
  id: string
  complaintNo: string
  status: ComplaintStatus
  type: ComplaintType
  customerName: string
  customerPhone: string
  brand: string
  counter: string
  floor: string
  productName: string
  productPrice: number
  purchaseDate: string
  complaintDate: string
  complaintContent: string
  refundAmount?: number
  exchangeProduct?: string
  currentHandlerRole: RoleKey
  currentHandler: string
  submitter: string
  submitterRole: RoleKey
  submitTime: string
  operations: OperationLog[]
  brandFeedbackList: BrandFeedback[]
  recheckCount: number
  returnCount: number
}
