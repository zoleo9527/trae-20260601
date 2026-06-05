export type Role = 'SALES' | 'BREWER' | 'PACKER' | 'ADMIN'
export type OrderStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'IN_PRODUCTION' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED' | 'RETURNED' | 'EXCEPTION'

export interface User {
  id: string
  username: string
  role: Role
  displayName: string
}

export interface OrderItem {
  id: string
  orderId: string
  productName: string
  specification: string
  quantity: number
  unit: string
}

export interface Order {
  id: string
  orderNo: string
  distributorName: string
  status: OrderStatus
  deliveryDate: string
  remark: string | null
  createdById: string
  createdBy: User
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  shipments?: Shipment[]
  auditLogs?: AuditLog[]
}

export interface Shipment {
  id: string
  orderId: string
  logisticsCompany: string | null
  trackingNo: string | null
  shippedAt: string | null
  receivedAt: string | null
  receivedById: string | null
  receiveRemark: string | null
  createdById: string
  createdBy: User
  createdAt: string
  order?: Order
}

export interface AuditLog {
  id: string
  orderId: string
  userId: string
  user: User
  action: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus | null
  remark: string | null
  createdAt: string
  order?: { id: string; orderNo: string; distributorName: string }
}
