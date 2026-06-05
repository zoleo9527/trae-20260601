export type UserRole = "FLORIST" | "DISPATCHER" | "AFTERCARE"

export type ProcurementStatus = "PENDING" | "IN_PROGRESS" | "REJECTED" | "CLOSED" | "NEEDS_REVIEW"

export const GRADING_LEVELS = { 
  A: "A", 
  B: "B", 
  C: "C", 
  SCRAP: "SCRAP", 
} as const 

export type GradingLevel = (typeof GRADING_LEVELS)[keyof typeof GRADING_LEVELS] 

export const VALID_GRADING_LEVELS = new Set(Object.values(GRADING_LEVELS)) 

export function normalizeGradingLevel(level: string | null | undefined): GradingLevel { 
  if (!level) return GRADING_LEVELS.SCRAP 
  const upperLevel = level.toUpperCase() 
  if (upperLevel === "REJECTED") return GRADING_LEVELS.SCRAP 
  if (VALID_GRADING_LEVELS.has(upperLevel as GradingLevel)) return upperLevel as GradingLevel 
  return GRADING_LEVELS.SCRAP 
}

export type Urgency = "NORMAL" | "URGENT" | "CRITICAL"

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface Procurement {
  id: string
  flowerName: string
  quantity: number
  unit: string
  supplier: string
  urgency: Urgency
  status: ProcurementStatus
  remarks?: string | null
  createdBy: User
  createdById: string
  createdAt: string
  updatedAt: string
  grading?: Grading | null
  statusChanges?: StatusChange[]
}

export interface Grading {
  id: string
  procurementId: string
  level: GradingLevel
  gradedBy: User
  gradedById: string
  gradedAt: string
  anomalyNote?: string | null
  remarks?: string | null
}

export interface StatusChange {
  id: string
  procurementId: string
  fromStatus: ProcurementStatus
  toStatus: ProcurementStatus
  changedBy: User
  changedById: string
  changedAt: string
  reason?: string | null
}

export const STATUS_LABELS: Record<ProcurementStatus, string> = {
  PENDING: "待办",
  IN_PROGRESS: "处理中",
  REJECTED: "被退回",
  CLOSED: "已关闭",
  NEEDS_REVIEW: "需回查"
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  NORMAL: "普通",
  URGENT: "紧急",
  CRITICAL: "特急"
}

export const ROLE_LABELS: Record<UserRole, string> = {
  FLORIST: "花艺师",
  DISPATCHER: "配送调度",
  AFTERCARE: "售后客服"
}

export const GRADING_LABELS: Record<GradingLevel, string> = {
  A: "A级",
  B: "B级",
  C: "C级",
  SCRAP: "报废"
}
