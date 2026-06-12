export type Role = 'accountant' | 'manager' | 'supervisor'

export const RoleMeta: Record<Role, { label: string; color: string }> = {
  accountant: { label: '记账会计', color: 'primary' },
  manager: { label: '客户经理', color: 'info' },
  supervisor: { label: '财务主管', color: 'warning' }
}

export type TaskStatus =
  | 'pending_bill'
  | 'pending_accounting'
  | 'accounting'
  | 'pending_review'
  | 'reviewing'
  | 'review_pass'
  | 'review_reject'
  | 'completed'

export const StatusMeta: Record<TaskStatus, { label: string; tone: 'gray' | 'blue' | 'cyan' | 'amber' | 'green' | 'red'; dot: boolean }> = {
  pending_bill: { label: '待收票据', tone: 'gray', dot: true },
  pending_accounting: { label: '待账务处理', tone: 'blue', dot: true },
  accounting: { label: '账务处理中', tone: 'cyan', dot: true },
  pending_review: { label: '待凭证复核', tone: 'amber', dot: true },
  reviewing: { label: '复核中', tone: 'amber', dot: true },
  review_pass: { label: '复核通过', tone: 'green', dot: false },
  review_reject: { label: '复核驳回', tone: 'red', dot: true },
  completed: { label: '已完成', tone: 'green', dot: false }
}

export interface Customer {
  id: string
  name: string
  taxNo: string
  industry: string
  scale: string
  accountManager: string
  accountant: string
  reviewer: string
  monthlyFee: number
  riskLevel: 'normal' | 'attention' | 'high'
  tags: string[]
}

export interface BillItem {
  id: string
  type: string
  amount: number
  count: number
  uploadedAt: string
  uploader: string
  note?: string
}

export interface VoucherEntry {
  id: string
  summary: string
  debitAccount: string
  debitAmount: number
  creditAccount: string
  creditAmount: number
  note?: string
}

export interface Voucher {
  id: string
  voucherNo: string
  date: string
  entries: VoucherEntry[]
  createdBy: string
  createdAt: string
  attachedBillIds: string[]
  status: 'draft' | 'submitted' | 'reviewed'
}

export interface ReviewRecord {
  id: string
  reviewer: string
  role: Role
  action: 'submit' | 'pass' | 'reject' | 'rework' | 'complete' | 'remind' | 'communicate' | 'submit_bill' | 'start_review'
  at: string
  comment: string
  issues?: { field: string; description: string; severity: 'error' | 'warning' | 'suggestion' }[]
}

export interface AccountingTask {
  id: string
  period: string
  customerId: string
  customer: Customer
  status: TaskStatus
  bills: BillItem[]
  vouchers: Voucher[]
  currentHandler: string
  deadline: string
  reviewRecords: ReviewRecord[]
  hasRisk: boolean
  riskNote?: string
  overdue: boolean
}

export interface RiskItem {
  id: string
  customerId: string
  customerName: string
  type: 'missing_bill' | 'abnormal_amount' | 'tax_deadline' | 'reject_times' | 'overdue'
  level: 'high' | 'medium' | 'low'
  title: string
  description: string
  relatedTaskId?: string
  updatedAt: string
}

export interface ActivityItem {
  id: string
  user: string
  role: Role
  action: string
  customerName: string
  target: string
  at: string
}

export interface TaxDeadline {
  id: string
  period: string
  taxType: string
  deadline: string
  customers: { id: string; name: string; status: 'done' | 'pending' | 'risk' }[]
}
