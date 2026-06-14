export type Role = 'recruiter' | 'onsite' | 'payroll'

export type RecordStatus =
  | 'normal'
  | 'returned'
  | 'overdue'
  | 'disputed'

export type SettlementStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'returned'
  | 'disputed'

export type ReconciliationStatus =
  | 'pending'
  | 'sent'
  | 'confirmed'
  | 'discrepancy'
  | 'disputed'

export interface PayrollSettlement {
  id: string
  period: string
  headcount: number
  totalGross: number
  totalDeduction: number
  totalNet: number
  status: SettlementStatus
  processedBy?: string
  processedAt?: string
  returnedReason?: string
  supplementNote?: string
}

export interface ClientReconciliation {
  id: string
  period: string
  clientName: string
  contractAmount: number
  billedAmount: number
  variance: number
  status: ReconciliationStatus
  sentAt?: string
  confirmedAt?: string
  discrepancyNote?: string
  disputedBy?: string
}

export type TimelineAction =
  | 'record_created'
  | 'settlement_processing'
  | 'settlement_confirmed'
  | 'settlement_returned'
  | 'settlement_disputed'
  | 'settlement_supplemented'
  | 'reconciliation_sent'
  | 'reconciliation_confirmed'
  | 'reconciliation_discrepancy'
  | 'reconciliation_disputed'
  | 'supplement_added'
  | 'dispute_escalated'

export interface TimelineEntry {
  id: string
  action: TimelineAction
  role: Role
  operator: string
  note?: string
  timestamp: string
}

export interface ResponsibilityInfo {
  pendingRole: Role | 'none'
  responsibilityText: string
  isUnclear: boolean
  involvedRoles: Role[]
  pendingAction: string
}

export interface OperationRecord {
  id: string
  batchNo: string
  employeeName: string
  clientName: string
  projectName: string
  role: Role
  recordStatus: RecordStatus
  settlement: PayrollSettlement
  reconciliation: ClientReconciliation
  returnedReason?: string
  supplementNote?: string
  disputeDetail?: string
  timeline: TimelineEntry[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TodoItem {
  id: string
  recordId: string
  role: Role
  type: 'settlement' | 'reconciliation' | 'supplement' | 'dispute'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  isRead: boolean
}

export interface FilterState {
  search: string
  status: RecordStatus | 'all'
  role: Role | 'all'
  pendingRole: Role | 'all' | 'unclear'
  period: string
  clientName: string
}

export const ROLE_LABELS: Record<Role, string> = {
  recruiter: '招聘专员',
  onsite: '驻场主管',
  payroll: '薪酬会计',
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  normal: '正常推进',
  returned: '退回补充',
  overdue: '逾期未处理',
  disputed: '责任争议',
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  confirmed: '已确认',
  returned: '已退回',
  disputed: '有争议',
}

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  pending: '待对账',
  sent: '已发送',
  confirmed: '已确认',
  discrepancy: '有差异',
  disputed: '有争议',
}

export const TIMELINE_ACTION_LABELS: Record<TimelineAction, string> = {
  record_created: '记录创建',
  settlement_processing: '工资结算-开始处理',
  settlement_confirmed: '工资结算-已确认',
  settlement_returned: '工资结算-已退回',
  settlement_disputed: '工资结算-标记争议',
  settlement_supplemented: '工资结算-补充信息',
  reconciliation_sent: '客户对账-发送对账单',
  reconciliation_confirmed: '客户对账-已确认',
  reconciliation_discrepancy: '客户对账-标记差异',
  reconciliation_disputed: '客户对账-标记争议',
  supplement_added: '补充备注',
  dispute_escalated: '争议升级',
}
