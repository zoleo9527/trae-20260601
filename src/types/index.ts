export type Role = 'guide' | 'designer' | 'warehouse'

export interface UserInfo {
  id: string
  name: string
  role: Role
  roleName: string
}

export const USERS: UserInfo[] = [
  { id: 'U001', name: '王小美', role: 'guide', roleName: '导购' },
  { id: 'U002', name: '李设计', role: 'designer', roleName: '设计师' },
  { id: 'U003', name: '张仓管', role: 'warehouse', roleName: '仓库员' },
]

export type SupplementStatus =
  | 'pending'        // 待处理（导购刚提交）
  | 'designing'      // 设计师量房复核中
  | 'confirmed'      // 设计师确认无误
  | 'warehousing'    // 仓库备货中
  | 'shipped'        // 已发货
  | 'completed'      // 已完成
  | 'rejected'       // 已驳回
  | 'rescheduled'    // 已改期
  | 'supplemented'   // 已补录

export const SUPPLEMENT_STATUS_MAP: Record<SupplementStatus, { label: string; color: string }> = {
  pending:      { label: '待处理',     color: 'default' },
  designing:    { label: '量房复核中', color: 'processing' },
  confirmed:    { label: '已确认',     color: 'blue' },
  warehousing:  { label: '仓库备货中', color: 'warning' },
  shipped:      { label: '已发货',     color: 'cyan' },
  completed:    { label: '已完成',     color: 'success' },
  rejected:     { label: '已驳回',     color: 'error' },
  rescheduled:  { label: '已改期',     color: 'purple' },
  supplemented: { label: '已补录',     color: 'magenta' },
}

export type ReturnStatus =
  | 'pending'        // 待复核
  | 'inspecting'     // 仓库验货中
  | 'confirmed'      // 复核通过
  | 'rejected'       // 驳回
  | 'supplemented'   // 补录信息
  | 'rescheduled'    // 改期待处理
  | 'refunded'       // 已退款（完成）

export const RETURN_STATUS_MAP: Record<ReturnStatus, { label: string; color: string }> = {
  pending:      { label: '待复核',     color: 'default' },
  inspecting:   { label: '验货中',     color: 'processing' },
  confirmed:    { label: '复核通过',   color: 'blue' },
  rejected:     { label: '已驳回',     color: 'error' },
  supplemented: { label: '已补录',     color: 'magenta' },
  rescheduled:  { label: '已改期',     color: 'purple' },
  refunded:     { label: '已退款',     color: 'success' },
}

export type ActionType =
  | 'create'           // 创建
  | 'submit'           // 提交
  | 'assign'           // 分派
  | 'start_design'     // 开始量房
  | 'confirm_design'   // 设计师确认
  | 'start_warehouse'  // 仓库开始备货
  | 'ship'             // 发货
  | 'complete'         // 完成
  | 'reject'           // 驳回
  | 'reschedule'       // 改期
  | 'supplement'       // 补录
  | 'inspect'          // 验货
  | 'pass'             // 通过
  | 'refund'           // 退款
  | 'export'           // 导出
  | 'comment'          // 备注/评论

export interface TileItem {
  sku: string
  name: string
  spec: string          // 规格，如 800x800mm
  color: string
  unit: string          // 片/箱
  quantity: number
  unitPrice: number
  remark?: string
}

export interface HistoryRecord {
  id: string
  action: ActionType
  actionLabel: string
  operatorId: string
  operatorName: string
  operatorRole: Role
  operatorRoleName: string
  timestamp: string
  fromStatus?: string
  toStatus?: string
  remark?: string
  changes?: Array<{ field: string; oldValue?: string; newValue?: string }>
  attachments?: Array<{ name: string; url: string }>
}

export interface SupplementApplication {
  id: string                       // 补砖单号，如 BZ20260615001
  orderNo: string                  // 关联原始销售单号
  customerName: string
  customerPhone: string
  address: string
  projectName?: string
  designerId?: string
  designerName?: string
  guideId: string
  guideName: string
  source: 'sample_book' | 'measurement_sheet' | 'replenish_form' | 'other'
  sourceLabel: string
  sourceRefNo?: string             // 关联样板册/量房单编号
  reason: string                   // 补砖原因
  tiles: TileItem[]
  totalAmount: number
  expectedDeliveryDate: string     // 期望送达日期
  actualDeliveryDate?: string
  status: SupplementStatus
  createdAt: string
  updatedAt: string
  history: HistoryRecord[]
}

export interface ReturnReview {
  id: string                       // 退货复核单号，如 TH20260615001
  orderNo: string                  // 关联原始销售单号
  supplementId?: string            // 关联补砖单号（如有）
  customerName: string
  customerPhone: string
  address: string
  applicantId: string              // 申请人ID
  applicantName: string
  applicantRole: Role
  warehouseId?: string
  warehouseName?: string
  reason: string                   // 退货原因
  tiles: TileItem[]
  totalAmount: number
  pickupDate: string               // 预约取货日期
  actualPickupDate?: string
  inspectionResult?: string        // 验货结果
  rejectReason?: string            // 驳回原因
  status: ReturnStatus
  createdAt: string
  updatedAt: string
  history: HistoryRecord[]
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface SupplementListQuery extends PaginationParams {
  keyword?: string
  status?: SupplementStatus
  dateFrom?: string
  dateTo?: string
}

export interface ReturnListQuery extends PaginationParams {
  keyword?: string
  status?: ReturnStatus
  dateFrom?: string
  dateTo?: string
}

export interface CreateSupplementParams {
  orderNo: string
  customerName: string
  customerPhone: string
  address: string
  projectName?: string
  guideId: string
  source: SupplementApplication['source']
  sourceRefNo?: string
  reason: string
  tiles: TileItem[]
  expectedDeliveryDate: string
}

export interface CreateReturnParams {
  orderNo: string
  supplementId?: string
  customerName: string
  customerPhone: string
  address: string
  applicantId: string
  reason: string
  tiles: TileItem[]
  pickupDate: string
}

export interface ExportResult {
  taskId: string
  fileName: string
  downloadUrl: string
  fileSize: number
  status: 'success'
  generatedAt: string
  recordCount: number
}
