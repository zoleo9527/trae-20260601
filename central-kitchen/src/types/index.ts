export type TableType = 'adult' | 'child' | 'vip'

export type BanquetStatus = 'preparing' | 'in_progress' | 'completed' | 'cancelled'

export type ChangeRequestStatus = 'pending_kitchen' | 'pending_fee' | 'approved' | 'rejected_by_kitchen' | 'rejected_by_fee' | 'cancelled'

export type ChangeType = 'add_tables' | 'change_table_type' | 'remove_tables'

export type NotificationStatus = 'notified' | 'not_notified' | 'acknowledged'

export interface Staff {
  id: string
  name: string
  role: 'hall_manager' | 'chef' | 'sales' | 'cashier' | 'waiter'
  phone: string
}

export interface TableConfig {
  type: TableType
  seats: number
  pricePerTable: number
  dishQuantity: number
}

export interface LinkageImpact {
  dishQuantity: number
  dishQuantityChange: number
  servingSpeed: number
  servingSpeedChange: number
  waitersRequired: number
  waitersChange: number
  totalAmount: number
  amountChange: number
  kitchenNotified: NotificationStatus
}

export interface Banquet {
  id: string
  name: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  hall: string
  originalTables: number
  currentTables: number
  tableType: TableType
  tableConfig: TableConfig
  status: BanquetStatus
  deposit: number
  totalAmount: number
  paidAmount: number
  waitersAssigned: number
  menuId: string
  menuName: string
  createTime: string
  updateTime: string
  remarks?: string
}

export interface TableChangeRequest {
  id: string
  banquetId: string
  banquetName: string
  changeType: ChangeType
  changeTypeLabel: string
  originalTables: number
  newTables: number
  tableCountChange: number
  originalTableType?: TableType
  newTableType?: TableType
  reason: string
  impact: LinkageImpact
  status: ChangeRequestStatus
  statusLabel: string
  applicant: Staff
  kitchenConfirmer?: Staff
  kitchenConfirmTime?: string
  kitchenRemark?: string
  feeConfirmer?: Staff
  feeConfirmTime?: string
  feeRemark?: string
  kitchenNotified: NotificationStatus
  kitchenNotifiedTime?: string
  kitchenNotifiedBy?: Staff
  createTime: string
  updateTime: string
}

export interface ShortageRecord {
  id: string
  banquetId?: string
  banquetName?: string
  dishName: string
  requiredQuantity: number
  availableQuantity: number
  shortageQuantity: number
  unit: string
  reportedBy: Staff
  reportedTime: string
  status: 'pending' | 'resolved' | 'partially_resolved'
  resolvedTime?: string
  resolvedBy?: Staff
  resolution?: string
  remarks?: string
}
