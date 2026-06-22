export interface Category {
  id: string
  name: string
  code: string
  unit: string
  defaultPrice: number
  description?: string
}

export interface MixedCategoryItem {
  categoryId: string
  categoryName: string
  estimatedWeight: number
  estimatedRatio: number
  remark?: string
}

export interface InboundRegistration {
  id: string
  registrationNo: string
  supplierName: string
  vehicleNo: string
  driverName: string
  driverPhone?: string
  mainCategoryId: string
  mainCategoryName: string
  isMixed: boolean
  mixedItems: MixedCategoryItem[]
  grossWeight: number
  tareWeight: number
  netWeight: number
  registrationRemark: string
  status: 'draft' | 'submitted' | 'reviewing' | 'confirmed' | 'disputed'
  submittedBy: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  priceSnapshot: number
  hasDispute: boolean
}

export interface WeightDispute {
  id: string
  inboundId: string
  disputedWeight: number
  originalWeight: number
  difference: number
  reason: string
  handler: string
  handledAt: string
  resolution: string
  status: 'pending' | 'resolved' | 'escalated'
}

export interface WeighingReview {
  id: string
  inboundId: string
  registrationNo: string
  reviewer: string
  reviewedAt: string
  confirmedGrossWeight: number
  confirmedTareWeight: number
  confirmedNetWeight: number
  confirmedMixedItems: MixedCategoryItem[]
  reviewRemark: string
  registrationRemarkSnapshot: string
  status: 'pending' | 'confirmed' | 'rejected' | 'disputed'
  disputeId?: string
  priceAdjustment?: number
  priceAdjustmentReason?: string
}

export interface OperationLog {
  id: string
  targetType: 'inbound' | 'review' | 'dispute'
  targetId: string
  action: string
  operator: string
  operatorRole: string
  timestamp: string
  detail: string
  oldValue?: any
  newValue?: any
}

export interface PriceChange {
  id: string
  categoryId: string
  categoryName: string
  oldPrice: number
  newPrice: number
  changedBy: string
  changedAt: string
  reason: string
}

export interface RecentItem {
  id: string
  type: 'inbound' | 'review'
  title: string
  subtitle: string
  status: string
  visitedAt: string
}

export type UserRole = 'weigher' | 'sortingLeader' | 'salesClerk' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
  roleLabel: string
}
