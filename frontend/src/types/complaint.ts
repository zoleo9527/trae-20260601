export type ComplaintCategory =
  | 'activity_occupation'
  | 'repair_timeout'
  | 'attribution_unclear'
  | 'noise'
  | 'cleanliness'
  | 'facility'
  | 'other'

export type ComplaintStatus =
  | 'registered'
  | 'judging'
  | 'assigned'
  | 'processing'
  | 'visiting'
  | 'completed'
  | 'closed'

export type SlaLevel = 'normal' | 'warning' | 'overdue'

export type ResponsibilityParty =
  | 'tenant'
  | 'property'
  | 'mall_ops'
  | 'customer_service'
  | 'third_party'
  | 'undetermined'

export type VisitResult =
  | 'satisfied'
  | 'basically_satisfied'
  | 'dissatisfied'
  | 'unreachable'
  | 'pending'

export interface KeyJudgement {
  id: string
  content: string
  operator: string
  operatorRole: string
  createdAt: string
  type: 'responsibility' | 'sla' | 'root_cause' | 'escalation' | 'other'
}

export interface StatusChangeLog {
  id: string
  fromStatus: ComplaintStatus | null
  toStatus: ComplaintStatus
  operator: string
  operatorRole: string
  remark: string
  createdAt: string
}

export interface ExceptionNote {
  id: string
  complaintId: string
  type: 'attribution_dispute' | 'sla_overdue' | 'tenant_refusal' | 'escalation' | 'other'
  title: string
  content: string
  operator: string
  operatorRole: string
  createdAt: string
  attachments?: string[]
}

export interface TenantVisit {
  id: string
  complaintId: string
  visitTime: string | null
  visitor: string
  visitorRole: string
  tenantContact: string
  tenantPhone: string
  tenantName: string
  shopCode: string
  result: VisitResult
  feedback: string
  improvementItems: string[]
  nextFollowUp: string | null
  createdAt: string
  updatedAt: string
}

export interface Complaint {
  id: string
  code: string
  title: string
  category: ComplaintCategory
  status: ComplaintStatus
  description: string
  complaintSource: 'customer' | 'tenant' | 'patrol' | 'hotline' | 'online_platform' | 'other'
  complainantName: string
  complainantPhone: string
  complainantType: 'customer' | 'tenant' | 'staff'
  locationFloor: string
  locationArea: string
  shopCode?: string
  shopName?: string
  tenantName?: string
  registeredBy: string
  registeredByRole: string
  registeredAt: string
  currentHandler: string
  currentHandlerRole: string
  assignedAt: string | null
  slaDeadline: string
  slaLevel: SlaLevel
  responsibilityParty: ResponsibilityParty
  responsibilityPartyDetail: string
  keyJudgements: KeyJudgement[]
  statusHistory: StatusChangeLog[]
  exceptionNotes: ExceptionNote[]
  tenantVisits: TenantVisit[]
  priority: 'urgent' | 'high' | 'normal' | 'low'
  repairType?: string
  repairTimeoutHours?: number
  activityName?: string
  activityOrganizer?: string
  attachments?: string[]
  closedAt?: string | null
  closedBy?: string
  closingRemark?: string
}

export interface ShopInfo {
  code: string
  name: string
  tenantName: string
  floor: string
  area: string
  contact: string
  phone: string
  category: string
}

export interface StaffInfo {
  id: string
  name: string
  role: string
  department: string
  phone: string
}

export const COMPLAINT_CATEGORY_MAP: Record<ComplaintCategory, string> = {
  activity_occupation: '活动占道',
  repair_timeout: '租户报修超时',
  attribution_unclear: '投诉归属不清',
  noise: '噪音干扰',
  cleanliness: '环境卫生',
  facility: '设施故障',
  other: '其他'
}

export const COMPLAINT_STATUS_MAP: Record<ComplaintStatus, { label: string; color: string }> = {
  registered: { label: '已登记', color: '#909399' },
  judging: { label: '判定中', color: '#e6a23c' },
  assigned: { label: '已派单', color: '#409eff' },
  processing: { label: '处理中', color: '#9b59b6' },
  visiting: { label: '回访中', color: '#3498db' },
  completed: { label: '处理完成', color: '#67c23a' },
  closed: { label: '已结案', color: '#606266' }
}

export const RESPONSIBILITY_PARTY_MAP: Record<ResponsibilityParty, string> = {
  tenant: '租户责任',
  property: '物业工程部',
  mall_ops: '商场运营部',
  customer_service: '客户服务部',
  third_party: '第三方供应商',
  undetermined: '待判定'
}

export const VISIT_RESULT_MAP: Record<VisitResult, { label: string; color: string }> = {
  satisfied: { label: '满意', color: '#67c23a' },
  basically_satisfied: { label: '基本满意', color: '#409eff' },
  dissatisfied: { label: '不满意', color: '#f56c6c' },
  unreachable: { label: '无法联系', color: '#909399' },
  pending: { label: '待回访', color: '#e6a23c' }
}

export const SLA_LEVEL_MAP: Record<SlaLevel, { label: string; color: string }> = {
  normal: { label: '时效正常', color: '#67c23a' },
  warning: { label: '即将超时', color: '#e6a23c' },
  overdue: { label: '已超时', color: '#f56c6c' }
}

export const PRIORITY_MAP = {
  urgent: { label: '紧急', color: '#f56c6c' },
  high: { label: '高', color: '#e6a23c' },
  normal: { label: '普通', color: '#409eff' },
  low: { label: '低', color: '#909399' }
}

export const COMPLAINT_SOURCE_MAP = {
  customer: '顾客现场投诉',
  tenant: '租户反馈',
  patrol: '巡场发现',
  hotline: '服务热线',
  online_platform: '线上平台',
  other: '其他渠道'
}

export function hasPendingVisit(c: Complaint | undefined | null): boolean {
  if (!c) return false
  return Array.isArray(c.tenantVisits) && c.tenantVisits.some(v => v.result === 'pending')
}

export function canStartVisit(c: Complaint | undefined | null): boolean {
  if (!c) return false
  return c.status === 'visiting' && hasPendingVisit(c)
}

export function findPendingVisit(c: Complaint | undefined | null) {
  if (!c) return null
  return c.tenantVisits.find(v => v.result === 'pending') || null
}
