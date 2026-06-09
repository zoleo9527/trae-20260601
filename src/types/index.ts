export type UserRole = 'sales' | 'warehouse' | 'aftersales'

export interface User {
  id: string
  name: string
  role: UserRole
}

export const ROLE_LABELS: Record<UserRole, string> = {
  sales: '销售内勤',
  warehouse: '仓库员',
  aftersales: '售后专员',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  sales: '提交临期预警、补录信息',
  warehouse: '确认预警、提交换货申请',
  aftersales: '审核换货、填写处理结果',
}

export type WarningStatus = 'pending' | 'confirmed' | 'rejected' | 'exchanged'

export const WARNING_STATUS_LABELS: Record<WarningStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已退回',
  exchanged: '已申请换货',
}

export type Urgency = 'critical' | 'urgent' | 'normal'

export const URGENCY_LABELS: Record<Urgency, string> = {
  critical: '7天内到期',
  urgent: '30天内到期',
  normal: '90天内到期',
}

export interface Warning {
  id: string
  productName: string
  batchNo: string
  expiryDate: string
  quantity: number
  unit: string
  storageLocation: string
  urgency: Urgency
  status: WarningStatus
  note: string
  createdById: string
  createdByName: string
  createdAt: string
  confirmedById: string
  confirmedByName: string
  confirmedAt: string
  confirmNote: string
  rejectReason: string
  updatedAt: string
}

export type ExchangeStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'supplemented'

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成',
  supplemented: '已补录',
}

export type ExchangeResult = 'return_supplier' | 'replace_new' | 'scrap' | 'other'

export const EXCHANGE_RESULT_LABELS: Record<ExchangeResult, string> = {
  return_supplier: '退回供应商',
  replace_new: '换新入库',
  scrap: '报废处理',
  other: '其他',
}

export interface Exchange {
  id: string
  warningId: string
  reason: string
  expectedHandling: string
  quantity: number
  supplierInfo: string
  handlingNote: string
  status: ExchangeStatus
  appliedById: string
  appliedByName: string
  appliedAt: string
  reviewedById: string
  reviewedByName: string
  reviewedAt: string
  reviewNote: string
  rejectReason: string
  result: ExchangeResult
  resultNote: string
  completedAt: string
  updatedAt: string
  supplementNote: string
  supplementedAt: string
  supplementById: string
  supplementByName: string
  attachmentName: string
  attachmentNote: string
}

export type OperationType =
  | 'create_warning'
  | 'confirm_warning'
  | 'reject_warning'
  | 'resubmit_warning'
  | 'create_exchange'
  | 'approve_exchange'
  | 'reject_exchange'
  | 'complete_exchange'
  | 'supplement_exchange'
  | 'resubmit_exchange'

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  create_warning: '提交预警',
  confirm_warning: '确认预警',
  reject_warning: '退回预警',
  resubmit_warning: '重新提交预警',
  create_exchange: '提交换货申请',
  approve_exchange: '审批通过',
  reject_exchange: '驳回换货',
  complete_exchange: '填写处理结果',
  supplement_exchange: '补录信息',
  resubmit_exchange: '重新提交换货',
}

export type RelatedType = 'warning' | 'exchange'

export interface OperationLog {
  id: string
  type: OperationType
  relatedId: string
  relatedType: RelatedType
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  operatedAt: string
  detail: string
  isSupplement: boolean
}

export type RecentItemType = 'warning' | 'exchange'

export interface RecentItem {
  id: string
  userId: string
  itemId: string
  itemType: RecentItemType
  itemTitle: string
  accessedAt: string
}
