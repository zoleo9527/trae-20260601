export type Role = 'purchase_manager' | 'production_leader' | 'store_supervisor'

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export type MealOrderStatus =
  | 'draft'
  | 'submitted'
  | 'production_review'
  | 'production_approved'
  | 'production_rejected'
  | 'distributed'
  | 'received'
  | 'shortage_reported'

export type ShortageStatus =
  | 'pending_review'
  | 'supply_review'
  | 'supply_approved'
  | 'supply_rejected'
  | 'replenishing'
  | 'replenished'
  | 'supervisor_review'
  | 'closed'

export interface MealItem {
  id: string
  name: string
  unit: string
  quantity: number
  actualQuantity?: number
  shortageQuantity?: number
  remark?: string
}

export interface Store {
  id: string
  name: string
  address: string
  contact: string
  phone: string
}

export interface StatusLog {
  id: string
  status: MealOrderStatus | ShortageStatus
  operator: string
  operatorRole: Role
  timestamp: string
  remark: string
}

export interface ShortageMaterial {
  id: string
  name: string
  type: 'image' | 'document' | 'text'
  url?: string
  content?: string
  uploadedAt: string
  uploadedBy: string
}

export interface ShortageReplenish {
  id: string
  orderId: string
  mealOrderId: string
  items: MealItem[]
  status: ShortageStatus
  previousConclusion: string
  materials: ShortageMaterial[]
  remarks: string
  supplyRemark?: string
  replenishRemark?: string
  supervisorRemark?: string
  supplyRejectionReason?: string
  resubmitRemark?: string
  statusLogs: StatusLog[]
  createdAt: string
  updatedAt: string
}

export interface MealOrder {
  id: string
  orderNo: string
  storeId: string
  storeName: string
  deliveryDate: string
  items: MealItem[]
  status: MealOrderStatus
  totalQuantity: number
  statusLogs: StatusLog[]
  productionRemark?: string
  productionRejectionReason?: string
  resubmitRemark?: string
  deliveryRemark?: string
  shortageReplenish?: ShortageReplenish
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface RolePermission {
  role: Role
  name: string
  description: string
  allowedStatuses: (MealOrderStatus | ShortageStatus)[]
  allowedActions: string[]
  menuItems: string[]
}
