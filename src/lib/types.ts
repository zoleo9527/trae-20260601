export type DamageStatus = 'pending' | 'processing' | 'anomaly' | 'completed'
export type CompensationStatus = 'pending' | 'accepted' | 'material_incomplete' | 'reviewing' | 'completed'
export type MaterialStatus = 'missing' | 'submitted' | 'verified'
export type UserRole = 'freight_clerk' | 'loading_leader' | 'customer_service' | 'station_manager'

export interface ResponsiblePerson {
  name: string
  role: UserRole
}

export interface TimelineNode {
  id: string
  event: string
  timestamp: string
  responsible: ResponsiblePerson | null
  description: string
  isGap: boolean
}

export interface ResponsibilityNode {
  id: string
  name: string
  role: UserRole
  segment: string
  startTime: string
  endTime: string | null
  isGap: boolean
}

export interface DamageRecord {
  id: string
  ticketNo: string
  goodsName: string
  goodsType: string
  damageType: string
  status: DamageStatus
  createdAt: string
  updatedAt: string
  timeline: TimelineNode[]
  responsibilityChain: ResponsibilityNode[]
  currentResponsible: ResponsiblePerson | null
  hasGap: boolean
  stationFrom: string
  stationTo: string
  consignor: string
  consignee: string
  weight: string
  urgency: 'normal' | 'urgent' | 'critical'
}

export interface CompensationMaterial {
  id: string
  name: string
  type: string
  submittedAt: string | null
  submittedBy: string | null
  status: MaterialStatus
}

export interface ResponsibilityLink {
  from: ResponsiblePerson & { segment: string }
  to: ResponsiblePerson & { segment: string }
  isGap: boolean
}

export interface CompensationRecord {
  id: string
  damageRecordId: string
  compNo: string
  amount: number
  status: CompensationStatus
  createdAt: string
  updatedAt: string
  materials: CompensationMaterial[]
  responsibilityLinks: ResponsibilityLink[]
  hasGap: boolean
  claimant: string
  claimantContact: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  freight_clerk: '货运员',
  loading_leader: '装卸班长',
  customer_service: '客服',
  station_manager: '站段管理员'
}

export const DAMAGE_STATUS_LABELS: Record<DamageStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  anomaly: '异常',
  completed: '已完成'
}

export const COMPENSATION_STATUS_LABELS: Record<CompensationStatus, string> = {
  pending: '待受理',
  accepted: '已受理',
  material_incomplete: '材料不全',
  reviewing: '审核中',
  completed: '赔付完成'
}

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  missing: '缺失',
  submitted: '已提交',
  verified: '已核实'
}
