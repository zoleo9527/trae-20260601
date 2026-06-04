export type UserRole = 'consultant' | 'assistant' | 'service'
export type AppointmentStatus = 'pending' | 'in_consultation' | 'plan_submitted' | 'plan_confirmed' | 'in_service' | 'completed'
export type ExceptionType = 'wording_mismatch' | 'post_surgery_complaint' | 'installment_mismatch'
export type ExceptionSeverity = 'high' | 'medium' | 'low'
export type ExceptionStatus = 'open' | 'processing' | 'resolved'
export type PlanStatus = 'draft' | 'submitted' | 'confirmed' | 'archived'
export type StepStatus = 'pending' | 'current' | 'completed'

export interface User {
  id: string
  name: string
  role: UserRole
  username: string
}

export interface Appointment {
  id: string
  patient_name: string
  patient_phone: string
  patient_age: number
  visit_count: number
  tags: string[]
  appointment_time: string
  status: AppointmentStatus
  consultant_id: string
  consultant_name?: string
  assistant_id: string | null
  assistant_name?: string
  service_id: string | null
  service_name?: string
  created_at: string
  updated_at: string
}

export interface PlanItem {
  name: string
  area: string
  unitPrice: number
  quantity: number
  subtotal: number
  note: string
}

export interface Plan {
  id: string
  appointment_id: string
  items: PlanItem[]
  total_price: number
  discount: number
  final_price: number
  status: PlanStatus
  submitted_by: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  change_log: any[]
  created_at: string
}

export interface WordingMismatchDetails {
  consultantWording: string
  doctorWording: string
  conflictItems: string[]
}

export interface PostSurgeryComplaintDetails {
  complaintContent: string
  relatedProject: string
  surgeryDate: string
  complaintDate: string
}

export interface InstallmentMismatchDetails {
  plannedInstallments: { period: number; plannedAmount: number; plannedDate: string; status: string }[]
  actualPayments: { period: number; paidAmount: number; paidDate: string }[]
  differenceItems: { period: number; plannedAmount: number; actualAmount: number; difference: number }[]
}

export type ExceptionDetails = WordingMismatchDetails | PostSurgeryComplaintDetails | InstallmentMismatchDetails

export interface Exception {
  id: string
  appointment_id: string
  type: ExceptionType
  severity: ExceptionSeverity
  status: ExceptionStatus
  title: string
  description: string
  details: ExceptionDetails
  created_by: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
  resolve_note: string | null
  patient_name?: string
}

export interface ConsultationNote {
  id: string
  appointment_id: string
  content: string
  author_id: string
  author_name: string
  author_role: string
  created_at: string
}

export interface VisitRecord {
  id: string
  appointment_id: string
  visit_date: string
  content: string
  satisfaction: number
  has_complaint: boolean
  visitor_id: string
  visitor_name: string
  created_at: string
}

export interface PlanConfirmationStep {
  id: string
  appointment_id: string
  step: number
  label: string
  role: UserRole
  status: StepStatus
  completed_by: string | null
  completed_at: string | null
  note: string | null
}

export interface InstallmentPlan {
  id: string
  appointment_id: string
  total_periods: number
  status: string
  items: InstallmentItem[]
}

export interface InstallmentItem {
  id: string
  plan_id: string
  period: number
  planned_amount: number
  planned_date: string
  status: string
  actual_amount: number | null
  actual_date: string | null
}

export interface AppointmentDetail {
  appointment: Appointment
  exceptions: Exception[]
  plans: Plan[]
  consultationNotes: ConsultationNote[]
  visitRecords: VisitRecord[]
  confirmationSteps: PlanConfirmationStep[]
  installmentPlan: InstallmentPlan | null
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '待面诊',
  in_consultation: '咨询中',
  plan_submitted: '方案已提交',
  plan_confirmed: '方案已确认',
  in_service: '服务中',
  completed: '已完成',
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  wording_mismatch: '口径不一致',
  post_surgery_complaint: '术后投诉',
  installment_mismatch: '分期对不上',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  consultant: '咨询师',
  assistant: '医生助理',
  service: '客服',
}

export const SEVERITY_COLORS: Record<ExceptionSeverity, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-yellow-400',
}

export const SEVERITY_LABELS: Record<ExceptionSeverity, string> = {
  high: '高',
  medium: '中',
  low: '低',
}
