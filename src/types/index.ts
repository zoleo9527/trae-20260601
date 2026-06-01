export type MealType = 'breakfast' | 'lunch' | 'dinner'

export type SubsidyType = 'low_income' | 'disabled' | 'over80' | 'veteran' | 'none'

export type OrderStatus = 'pending' | 'served' | 'verified' | 'cancelled' | 'refund_requested'

export type ViewMode = 'today' | 'tomorrow' | 'abnormal'

export type RefundReason = 'not_eating' | 'hospital' | 'family_cancel' | 'other'

export interface Order {
  id: string
  elderName: string
  mealType: MealType
  dishName: string
  subsidyType: SubsidyType
  subsidyExpired: boolean
  deliveryAddress: string
  status: OrderStatus
  orderDate: string
  isTemporary: boolean
  note: string
  duplicateOrder: boolean
  verifiedAt: string | null
  refundReason: RefundReason | null
  isServedRefund: boolean
  statusBeforeRefund: OrderStatus | null
  phone: string
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
}

export const SUBSIDY_TYPE_LABELS: Record<SubsidyType, string> = {
  low_income: '低保',
  disabled: '残疾',
  over80: '80岁以上',
  veteran: '优抚',
  none: '自费',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待出餐',
  served: '已出餐',
  verified: '已核销',
  cancelled: '已取消',
  refund_requested: '退餐申请',
}

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  not_eating: '不想吃',
  hospital: '住院',
  family_cancel: '家属取消',
  other: '其他',
}

export const SUBSIDY_COLORS: Record<SubsidyType, string> = {
  low_income: 'bg-amber-100 text-amber-800',
  disabled: 'bg-blue-100 text-blue-800',
  over80: 'bg-purple-100 text-purple-800',
  veteran: 'bg-red-100 text-red-800',
  none: 'bg-gray-100 text-gray-600',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-sky-100 text-sky-800',
  served: 'bg-emerald-100 text-emerald-800',
  verified: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  refund_requested: 'bg-red-100 text-red-800',
}

export function getRefundStatusLabel(statusBeforeRefund: OrderStatus | null): string {
  switch (statusBeforeRefund) {
    case 'verified':
      return '已核销退餐'
    case 'served':
      return '已出餐退餐'
    case 'pending':
    default:
      return '退餐申请'
  }
}

export function getRefundStatusColor(statusBeforeRefund: OrderStatus | null): string {
  const requiresFeeConfirm = statusBeforeRefund === 'served' || statusBeforeRefund === 'verified'
  return requiresFeeConfirm ? 'bg-rose-100 text-rose-700' : 'bg-red-100 text-red-700'
}
