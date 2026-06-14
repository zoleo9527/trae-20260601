export type UserRole = 'collector' | 'evaluator' | 'finance' | 'sales'

export interface User {
  id: string
  name: string
  role: UserRole
}

export type VehicleStatus =
  | 'pending_evaluation'   // 入库待评估
  | 'evaluating'           // 评估中
  | 'pending_pricing'      // 待定价
  | 'pricing_pending'      // 定价待确认
  | 'listed'               // 已上架
  | 'following'            // 客户跟进中
  | 'sold'                 // 已成交
  | 'unlisted'             // 已下架

export type TimelineEventType = 'status_change' | 'handover' | 'pricing'

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'other'
  uploadedAt: string
}

export interface TimelineEvent {
  id: string
  status: VehicleStatus
  operator: User
  toUser?: User
  time: string
  remark: string
  type: TimelineEventType
  attachments?: Attachment[]
  data?: any
}

export type FollowupMethod = 'phone' | 'wechat' | 'visit'

export type FollowupResult =
  | 'pending'      // 待联系
  | 'interested'   // 有意向
  | 'negotiating'  // 谈判中
  | 'success'      // 成交
  | 'failed'       // 失败

export interface FollowupRecord {
  id: string
  vehicleId: string
  operator: User
  time: string
  method: FollowupMethod
  customerInfo: string
  content: string
  nextFollowupTime: string | null
  result: FollowupResult
  attachments?: Attachment[]
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  brand: string
  year: number
  mileage: number
  purchasePrice: number
  listedPrice: number | null
  status: VehicleStatus
  collector: User
  evaluator: User | null
  financeStaff: User | null
  salesRep: User | null
  timeline: TimelineEvent[]
  followups: FollowupRecord[]
  createdAt: string
  updatedAt: string
}

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  textColor: string
  canTransitionTo: VehicleStatus[]
  requiredRole: UserRole
  action: string
}

export interface FilterOptions {
  status: VehicleStatus[]
  collector: string | null
  evaluator: string | null
  financeStaff: string | null
  brand: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
}

export interface PricingData {
  purchasePrice: number
  suggestedPrice: number
  finalPrice?: number
  financePlan?: string
}
