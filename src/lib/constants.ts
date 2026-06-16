export const STORAGE_KEYS = {
  BOOKINGS: 'farm_bookings',
  PROCUREMENTS: 'farm_procurements',
  ACCOMMODATIONS: 'farm_accommodations',
  INVENTORY: 'farm_inventory',
  ALERTS: 'farm_alerts',
  NOTIFICATIONS: 'farm_notifications'
} as const;

export const BOOKING_STATUS_LABELS = {
  pending: '待确认',
  confirmed: '已确认',
  arrived: '已到店',
  dining: '用餐中',
  billing: '结账中',
  completed: '已完成',
  cancelled: '已取消'
} as const;

export const PROCUREMENT_STATUS_LABELS = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  purchasing: '采购中',
  received: '已收货',
  completed: '已完成'
} as const;

export const ACCOMMODATION_STATUS_LABELS = {
  checked_in: '已入住',
  checked_out: '已退房'
} as const;

export const ALERT_SEVERITY_LABELS = {
  high: '高',
  medium: '中',
  low: '低'
} as const;

export const ALERT_TYPE_LABELS = {
  inventory: '库存',
  procurement: '采购',
  booking: '预订',
  accommodation: '住宿'
} as const;

export const USERS = {
  BOSS: '老板',
  KITCHEN: '后厨',
  MAID: '客房阿姨'
} as const;