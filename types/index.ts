export type CaseStatus = 'PENDING_SUBMIT' | 'SUBMITTED' | 'REJECTED' | 'COMPLETED' | 'REVIEW_FAILED' | 'PENDING_REVIEW'

export type UploadStatus = 'NOT_UPLOADED' | 'UPLOADED' | 'CONFIRMED'

export type Role = 'CLAIM_AGENT' | 'SURVEYOR' | 'UNDERWRITER'

export type ActionType = 'SUBMIT' | 'VERIFY' | 'REJECT' | 'SUPPLEMENT' | 'CONFIRM'

export interface CaseReport {
  id: string
  reportNo: string
  policyNo: string
  policyHolder: string
  accidentDesc: string
  reporterId: string
  status: CaseStatus
  createdAt: string
  updatedAt: string
  materials?: MaterialList[]
  logs?: OperationLog[]
}

export interface MaterialList {
  id: string
  caseId: string
  materialName: string
  materialType: string
  attachmentUrl: string | null
  uploadStatus: UploadStatus
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OperationLog {
  id: string
  caseId: string
  materialId: string | null
  operatorId: string
  operatorRole: Role
  actionType: ActionType
  beforeStatus: string | null
  afterStatus: string | null
  remark: string | null
  createdAt: string
}

export interface CreateCaseRequest {
  policyNo: string
  policyHolder: string
  accidentDesc: string
  reporterId: string
}

export interface SubmitCaseRequest {
  operatorId: string
  operatorRole: Role
}

export interface RejectCaseRequest {
  operatorId: string
  reason: string
}

export interface CompleteCaseRequest {
  operatorId: string
}

export interface CreateMaterialRequest {
  caseId: string
  materialName: string
  materialType: string
}

export interface UploadMaterialRequest {
  attachmentUrl: string
}

export interface VerifyMaterialRequest {
  operatorId: string
  status: 'confirmed' | 'rejected'
  remark?: string
}

export const statusLabels: Record<CaseStatus, string> = {
  PENDING_SUBMIT: '待提交',
  SUBMITTED: '已提交',
  REJECTED: '已驳回',
  COMPLETED: '已完成',
  REVIEW_FAILED: '复核不通过',
  PENDING_REVIEW: '待核赔'
}

export const roleLabels: Record<Role, string> = {
  CLAIM_AGENT: '理赔专员',
  SURVEYOR: '查勘员',
  UNDERWRITER: '核赔主管'
}

export const actionLabels: Record<ActionType, string> = {
  SUBMIT: '提交',
  VERIFY: '审核',
  REJECT: '驳回',
  SUPPLEMENT: '补录',
  CONFIRM: '确认'
}

export const uploadStatusLabels: Record<UploadStatus, string> = {
  NOT_UPLOADED: '未上传',
  UPLOADED: '已上传',
  CONFIRMED: '已确认'
}
