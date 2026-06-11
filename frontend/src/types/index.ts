export type DocStatus = '待整理' | '待审核' | '待签认' | '已签认' | '已驳回'
export type DocType = '布线图' | '材料领用单' | '现场照片' | '测试报告' | '验收记录'
export type AssigneeRole = '项目负责人' | '施工班组长' | '资料员'
export type ExceptionCategory = '资料缺失' | '照片不符' | '材料领用差异' | '布线图错误' | '其他'
export type ExceptionStatus = '待处理' | '处理中' | '已解决' | '已升级'
export type RemarkStage = '整理' | '审核' | '签认' | '异常处理'
export type SignOffResult = '已签认' | '已驳回'

export interface CompletionDocument {
  id: string
  project_name: string
  doc_type: DocType
  status: DocStatus
  assignee_name: string
  assignee_role: AssigneeRole
  created_at: string
  updated_at: string
  remarks_count?: number
  exceptions_count?: number
  latest_remark?: string
}

export interface DocumentDetail extends CompletionDocument {
  remarks: Remark[]
  exceptions: Exception[]
  signOffs: SignOff[]
}

export interface Remark {
  id: string
  document_id: string
  content: string
  author: string
  author_role: string
  stage: RemarkStage
  created_at: string
}

export interface Exception {
  id: string
  document_id: string
  category: ExceptionCategory
  description: string
  status: ExceptionStatus
  handler: string | null
  handler_role: string | null
  created_at: string
  resolved_at: string | null
  records: ExceptionRecord[]
}

export interface ExceptionRecord {
  id: string
  exception_id: string
  action: string
  operator: string
  operator_role: string
  created_at: string
}

export interface SignOff {
  id: string
  document_id: string
  client_name: string
  result: SignOffResult
  comment: string | null
  signed_at: string
}

export interface DashboardOverview {
  byRole: Array<{ role: string; count: number; overdueCount: number }>
  byStatus: Array<{ status: string; count: number }>
  totalDocuments: number
}

export interface RiskItem extends CompletionDocument {
  riskReason: string
}

export interface RecentChange {
  type: string
  documentId: string
  projectName: string
  description: string
  timestamp: string
}
