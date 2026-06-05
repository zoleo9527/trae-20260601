export type ComplaintStatus = "pending" | "processing" | "closed" | "reviewed"
export type ProblemType = "delivery_late" | "flower_replace" | "card_error" | "customer_reject"
export type Urgency = "urgent" | "normal" | "low"
export type CompensationType = "reflower" | "refund" | "coupon"
export type RootCause = "production" | "delivery" | "note_understanding" | "other"
export type Role = "cs" | "florist" | "dispatcher"

export interface TimelineEntry {
  id: string
  role: Role
  author: string
  content: string
  timestamp: string
  isInternal: boolean
}

export interface Compensation {
  type: CompensationType
  amount: number
  reason: string
  confirmedBy: string
  confirmedAt: string | null
}

export interface ReviewConclusion {
  rootCause: RootCause
  improvement: string
  reviewedBy: string
  reviewedAt: string
}

export interface Complaint {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  problemType: ProblemType
  urgency: Urgency
  status: ComplaintStatus
  description: string
  bouquetContent: string
  deliveryAddress: string
  expectedDelivery: string
  actualDelivery: string | null
  createdAt: string
  assignee: string
  timeline: TimelineEntry[]
  compensation: Compensation | null
  closeReason: string | null
  closedAt: string | null
  closedBy: string | null
  reviewConclusion: ReviewConclusion | null
}

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  delivery_late: "配送迟到",
  flower_replace: "花材替换",
  card_error: "卡片错误",
  customer_reject: "客户拒收",
}

export const PROBLEM_TYPE_COLORS: Record<ProblemType, string> = {
  delivery_late: "bg-honey-100 text-honey-500 border-honey-300",
  flower_replace: "bg-moss-50 text-moss-600 border-moss-200",
  card_error: "bg-brand-50 text-brand-600 border-brand-200",
  customer_reject: "bg-blush-50 text-blush-500 border-blush-200",
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  closed: "已关闭",
  reviewed: "已复盘",
}

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  pending: "bg-blush-100 text-blush-500",
  processing: "bg-honey-100 text-honey-500",
  closed: "bg-moss-100 text-moss-600",
  reviewed: "bg-brand-100 text-brand-600",
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  urgent: "紧急",
  normal: "一般",
  low: "低",
}

export const COMPENSATION_LABELS: Record<CompensationType, string> = {
  reflower: "补花",
  refund: "退款",
  coupon: "优惠券",
}

export const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  production: "制作环节",
  delivery: "配送环节",
  note_understanding: "备注理解",
  other: "其他",
}

export const ROLE_LABELS: Record<Role, string> = {
  cs: "售后客服",
  florist: "花艺师",
  dispatcher: "配送调度",
}

export const ROLE_COLORS: Record<Role, string> = {
  cs: "bg-brand-500",
  florist: "bg-moss-500",
  dispatcher: "bg-honey-500",
}
