export type DetentionStatus = 'detained' | 'supplementing' | 'reviewing' | 'released' | 'returned'

export type DetainReason =
  | 'name_mismatch'
  | 'missing_cert_page'
  | 'expired_cert'
  | 'overweight'
  | 'prohibited_item'
  | 'packaging_noncompliant'
  | 'other'

export const DETAIN_REASON_LABELS: Record<DetainReason, string> = {
  name_mismatch: '品名不符',
  missing_cert_page: '证照缺页',
  expired_cert: '证照过期',
  overweight: '超重',
  prohibited_item: '禁运物品',
  packaging_noncompliant: '包装不合格',
  other: '其他',
}

export const STATUS_LABELS: Record<DetentionStatus, string> = {
  detained: '已扣留',
  supplementing: '补证中',
  reviewing: '复核中',
  released: '已放行',
  returned: '已退回',
}

export const STATUS_COLORS: Record<DetentionStatus, string> = {
  detained: 'red',
  supplementing: 'orange',
  reviewing: 'blue',
  released: 'green',
  returned: 'default',
}

export interface RequiredDoc {
  id: string
  docName: string
  description: string
  isRequired: boolean
}

export interface SuppDoc {
  id: string
  docName: string
  uploadTime: string
  uploadedBy: string
  fileName: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string
}

export interface Review {
  id: string
  reviewer: string
  reviewTime: string
  opinion: 'approve' | 'reject'
  comment: string
}

export interface Detention {
  id: string
  waybillNo: string
  goodsName: string
  declaredGoodsName: string
  goodsCode: string
  detainTime: string
  detainReason: DetainReason
  detainBasis: string
  inspector: string
  receiver: string
  warehouseImpact: string
  status: DetentionStatus
  requiredDocs: RequiredDoc[]
  supplementaryDocs: SuppDoc[]
  reviews: Review[]
  finalResult: 'released' | 'returned' | null
  finalResultTime: string | null
  finalResultBy: string | null
  finalResultComment: string | null
  originalDocs: OriginalDoc[]
}

export interface OriginalDoc {
  docName: string
  docNo: string
  issueDate: string
  status: 'normal' | 'missing' | 'missing_page' | 'expired' | 'mismatch'
  remark: string
}

export interface CreateDetentionReq {
  waybillNo: string
  goodsName: string
  declaredGoodsName: string
  goodsCode: string
  detainReason: DetainReason
  detainBasis: string
  inspector: string
  receiver: string
  warehouseImpact: string
  requiredDocs: Omit<RequiredDoc, 'id'>[]
  originalDocs: Omit<OriginalDoc, 'status' | 'remark'>[]
}

export interface SubmitSuppReq {
  docName: string
  uploadedBy: string
  fileName: string
}

export interface SubmitReviewReq {
  reviewer: string
  opinion: 'approve' | 'reject'
  comment: string
}

export interface SubmitResultReq {
  result: 'released' | 'returned'
  operator: string
  comment: string
}
