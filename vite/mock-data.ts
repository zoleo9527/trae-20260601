export type SupplementStatus =
  | 'pending'
  | 'designing'
  | 'confirmed'
  | 'rejected'
  | 'supplemented'
  | 'rescheduled'
  | 'warehousing'
  | 'shipped'
  | 'completed'

export type ReturnStatus =
  | 'pending'
  | 'inspecting'
  | 'confirmed'
  | 'rejected'
  | 'supplemented'
  | 'rescheduled'
  | 'refunded'

export type ActionType =
  | 'create'
  | 'submit'
  | 'start_design'
  | 'confirm_design'
  | 'reject'
  | 'supplement'
  | 'reschedule'
  | 'start_warehouse'
  | 'ship'
  | 'complete'
  | 'inspect'
  | 'pass'
  | 'refund'

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

export interface TileItem {
  sku: string
  name: string
  spec?: string
  color?: string
  unit: string
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
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  address: string
  projectName?: string
  guideId: string
  guideName: string
  source: 'sample_book' | 'measurement_sheet' | 'replenish_form' | 'other'
  sourceLabel: string
  sourceRefNo?: string
  reason: string
  tiles: TileItem[]
  totalAmount: number
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  designerId?: string
  designerName?: string
  status: SupplementStatus
  expressNo?: string
  createdAt: string
  updatedAt: string
  history: HistoryRecord[]
}

export interface ReturnReview {
  id: string
  orderNo: string
  supplementId?: string
  customerName: string
  customerPhone: string
  address: string
  applicantId: string
  applicantName: string
  applicantRole: Role
  reason: string
  tiles: TileItem[]
  totalAmount: number
  pickupDate: string
  actualPickupDate?: string
  warehouseId?: string
  warehouseName?: string
  inspectionResult?: string
  rejectReason?: string
  refundAmount?: number
  status: ReturnStatus
  createdAt: string
  updatedAt: string
  history: HistoryRecord[]
}

function _roleName(role: Role): string {
  return { guide: '导购', designer: '设计师', warehouse: '仓库员' }[role]
}

function _user(id: string): UserInfo | undefined {
  return USERS.find(u => u.id === id)
}

export function _genHistory(
  action: ActionType,
  actionLabel: string,
  userId: string,
  opts: Partial<HistoryRecord> = {}
): HistoryRecord {
  const user = _user(userId)
  return {
    id: 'H' + Date.now() + Math.random().toString(36).slice(2, 8),
    action,
    actionLabel,
    operatorId: userId,
    operatorName: user?.name || '系统',
    operatorRole: user?.role || 'guide',
    operatorRoleName: user ? _roleName(user.role) : '系统',
    timestamp: opts.timestamp || new Date().toISOString(),
    ...opts,
  }
}

export function _amount(tiles: TileItem[]): number {
  return tiles.reduce((s, t) => s + t.quantity * t.unitPrice, 0)
}

// ============ 种子数据 ============

const _tilesNormal: TileItem[] = [
  { sku: 'TL-001', name: '爵士白大理石砖', spec: '800x800mm', color: '米白', unit: '片', quantity: 56, unitPrice: 188, remark: '客厅通铺' },
  { sku: 'TL-002', name: '仿古木纹砖', spec: '200x1200mm', color: '胡桃木', unit: '片', quantity: 120, unitPrice: 96, remark: '卧室地面' },
]

const _tilesProblem: TileItem[] = [
  { sku: 'TL-003', name: '灰色通体砖', spec: '600x600mm', color: '深灰', unit: '片', quantity: 88, unitPrice: 128, remark: '厨房墙地通用' },
  { sku: 'TL-004', name: '马赛克瓷砖', spec: '300x300mm', color: '拼花', unit: '箱', quantity: 12, unitPrice: 320, remark: '卫浴背景墙' },
]

const _tilesReturn: TileItem[] = [
  { sku: 'TL-001', name: '爵士白大理石砖', spec: '800x800mm', color: '米白', unit: '片', quantity: 8, unitPrice: 188, remark: '切割损耗剩余' },
]

const _tilesReturnProblem: TileItem[] = [
  { sku: 'TL-003', name: '灰色通体砖', spec: '600x600mm', color: '深灰', unit: '片', quantity: 15, unitPrice: 128, remark: '色差问题退货' },
  { sku: 'TL-004', name: '马赛克瓷砖', spec: '300x300mm', color: '拼花', unit: '箱', quantity: 3, unitPrice: 320, remark: '图案不符' },
]

// ============ 补砖种子数据 ============

// 正常单：导购提交 → 设计师复核 → 仓库备货 → 发货 → 完成
const supplementNormal: SupplementApplication = {
  id: 'BZ20260601001',
  orderNo: 'XS20260528003',
  customerName: '陈先生',
  customerPhone: '138****8821',
  address: '广州市天河区珠江新城中海花城湾 A 栋 2301',
  projectName: '中海花城湾精装',
  designerId: 'U002',
  designerName: '李设计',
  guideId: 'U001',
  guideName: '王小美',
  source: 'measurement_sheet',
  sourceLabel: '量房单',
  sourceRefNo: 'LF20260530017',
  reason: '客厅及卧室切割损耗补砖，设计师现场复核后追加。',
  tiles: _tilesNormal,
  totalAmount: _amount(_tilesNormal),
  expectedDeliveryDate: '2026-06-08',
  actualDeliveryDate: '2026-06-08',
  status: 'completed',
  createdAt: '2026-06-01T09:15:00.000Z',
  updatedAt: '2026-06-10T14:30:00.000Z',
  history: [
    { ..._genHistory('create', '创建补砖申请', 'U001', { fromStatus: undefined, toStatus: 'pending', remark: '从量房单 LF20260530017 带出数据，首次录入。' }), timestamp: '2026-06-01T09:15:00.000Z' },
    { ..._genHistory('submit', '提交审核', 'U001', { fromStatus: 'pending', toStatus: 'designing', remark: '提交设计师量房复核。' }), timestamp: '2026-06-01T09:20:00.000Z' },
    { ..._genHistory('start_design', '开始量房复核', 'U002', { remark: '现场量房，对比原销售单用量。' }), timestamp: '2026-06-02T10:00:00.000Z' },
    { ..._genHistory('confirm_design', '设计师确认无误', 'U002', { fromStatus: 'designing', toStatus: 'confirmed', remark: '损耗计算合理，数量确认，转仓库备货。', changes: [{ field: '设计师备注', oldValue: '', newValue: '建议6月8日送达' }] }), timestamp: '2026-06-03T15:42:00.000Z' },
    { ..._genHistory('start_warehouse', '仓库开始备货', 'U003', { fromStatus: 'confirmed', toStatus: 'warehousing' }), timestamp: '2026-06-04T09:00:00.000Z' },
    { ..._genHistory('ship', '安排发货', 'U003', { fromStatus: 'warehousing', toStatus: 'shipped', remark: '物流单号 SF1234567890' }), timestamp: '2026-06-07T16:20:00.000Z' },
    { ..._genHistory('complete', '客户签收完成', 'U001', { fromStatus: 'shipped', toStatus: 'completed', remark: '数量核对无误，客户签字确认。' }), timestamp: '2026-06-10T14:30:00.000Z' },
  ],
}

// 问题单：改期、补录、驳回
const supplementProblem: SupplementApplication = {
  id: 'BZ20260610007',
  orderNo: 'XS20260605012',
  customerName: '林女士',
  customerPhone: '139****3372',
  address: '深圳市南山区蛇口鲸山别墅 9 栋',
  projectName: '鲸山别墅翻新',
  designerId: 'U002',
  designerName: '李设计',
  guideId: 'U001',
  guideName: '王小美',
  source: 'replenish_form',
  sourceLabel: '补货申请单',
  sourceRefNo: 'BH20260608003',
  reason: '厨房墙砖缺货，临时更换型号后需补砖；卫浴马赛克型号下单有误。',
  tiles: _tilesProblem,
  totalAmount: _amount(_tilesProblem),
  expectedDeliveryDate: '2026-06-18',
  status: 'rescheduled',
  createdAt: '2026-06-10T11:08:00.000Z',
  updatedAt: '2026-06-14T17:55:00.000Z',
  history: [
    { ..._genHistory('create', '创建补砖申请', 'U001', { fromStatus: undefined, toStatus: 'pending', remark: '来源于补货申请单 BH20260608003。' }), timestamp: '2026-06-10T11:08:00.000Z' },
    { ..._genHistory('submit', '提交审核', 'U001', { fromStatus: 'pending', toStatus: 'designing' }), timestamp: '2026-06-10T11:25:00.000Z' },
    { ..._genHistory('reject', '设计师驳回', 'U002', { fromStatus: 'designing', toStatus: 'rejected', remark: '马赛克型号错误，与样板册编号不一致；灰色通体砖数量需重新核对，请补录后再提交。', changes: [{ field: '驳回原因', oldValue: '', newValue: '型号不一致、数量存疑' }] }), timestamp: '2026-06-11T16:40:00.000Z' },
    { ..._genHistory('supplement', '导购补录信息', 'U001', { fromStatus: 'rejected', toStatus: 'supplemented', remark: '已更正马赛克 SKU，数量按现场实际复量结果补录。', changes: [{ field: '马赛克 SKU', oldValue: 'TL-004A', newValue: 'TL-004' }, { field: '马赛克数量', oldValue: '10 箱', newValue: '12 箱' }] }), timestamp: '2026-06-12T10:15:00.000Z' },
    { ..._genHistory('submit', '重新提交设计师复核', 'U001', { fromStatus: 'supplemented', toStatus: 'designing' }), timestamp: '2026-06-12T10:20:00.000Z' },
    { ..._genHistory('confirm_design', '设计师确认无误', 'U002', { fromStatus: 'designing', toStatus: 'confirmed', remark: '型号、数量已核对。' }), timestamp: '2026-06-13T09:30:00.000Z' },
    { ..._genHistory('reschedule', '客户要求改期送达', 'U001', { fromStatus: 'confirmed', toStatus: 'rescheduled', remark: '因工地进度调整，送达日期由 6月15日 改到 6月18日。', changes: [{ field: '期望送达日期', oldValue: '2026-06-15', newValue: '2026-06-18' }] }), timestamp: '2026-06-14T17:55:00.000Z' },
  ],
}

const supplementPending: SupplementApplication = {
  id: 'BZ20260614009',
  orderNo: 'XS20260610005',
  customerName: '赵先生',
  customerPhone: '137****0091',
  address: '佛山市禅城区绿岛湖壹号 3 座 1802',
  designerId: 'U002',
  designerName: '李设计',
  guideId: 'U001',
  guideName: '王小美',
  source: 'sample_book',
  sourceLabel: '样板册',
  sourceRefNo: 'MB20260602021',
  reason: '客户追加阳台砖，按样板册选款。',
  tiles: [
    { sku: 'TL-005', name: '户外防滑砖', spec: '400x400mm', color: '芝麻灰', unit: '片', quantity: 60, unitPrice: 58 },
  ],
  totalAmount: 3480,
  expectedDeliveryDate: '2026-06-22',
  status: 'pending',
  createdAt: '2026-06-14T16:10:00.000Z',
  updatedAt: '2026-06-14T16:10:00.000Z',
  history: [
    { ..._genHistory('create', '创建补砖申请', 'U001', { toStatus: 'pending', remark: '从样板册选款带出，待提交。' }), timestamp: '2026-06-14T16:10:00.000Z' },
  ],
}

// ============ 退货种子数据 ============

// 正常单：导购申请 → 仓库验货 → 复核通过 → 退款完成
const returnNormal: ReturnReview = {
  id: 'TH20260603002',
  orderNo: 'XS20260528003',
  supplementId: 'BZ20260601001',
  customerName: '陈先生',
  customerPhone: '138****8821',
  address: '广州市天河区珠江新城中海花城湾 A 栋 2301',
  applicantId: 'U001',
  applicantName: '王小美',
  applicantRole: 'guide',
  warehouseId: 'U003',
  warehouseName: '张仓管',
  reason: '切割损耗剩余未拆箱瓷砖，整箱退货。',
  tiles: _tilesReturn,
  totalAmount: _amount(_tilesReturn),
  pickupDate: '2026-06-12',
  actualPickupDate: '2026-06-12',
  inspectionResult: '货物包装完好，未拆封，无破损，符合退货条件。',
  status: 'refunded',
  createdAt: '2026-06-03T10:00:00.000Z',
  updatedAt: '2026-06-14T11:00:00.000Z',
  history: [
    { ..._genHistory('create', '创建退货申请', 'U001', { toStatus: 'pending', remark: '关联补砖单 BZ20260601001。' }), timestamp: '2026-06-03T10:00:00.000Z' },
    { ..._genHistory('inspect', '仓库验货', 'U003', { fromStatus: 'pending', toStatus: 'inspecting', remark: '预约 6月12日 上门取货。' }), timestamp: '2026-06-04T09:30:00.000Z' },
    { ..._genHistory('pass', '复核通过', 'U003', { fromStatus: 'inspecting', toStatus: 'confirmed', remark: '包装完好，数量 8 片，已入库。', changes: [{ field: '验货结果', oldValue: '', newValue: '符合退货条件' }] }), timestamp: '2026-06-12T16:45:00.000Z' },
    { ..._genHistory('refund', '退款完成', 'U001', { fromStatus: 'confirmed', toStatus: 'refunded', remark: '原路退款 ¥1,504.00，已到账。', changes: [{ field: '退款金额', oldValue: '', newValue: '¥1,504.00' }] }), timestamp: '2026-06-14T11:00:00.000Z' },
  ],
}

// 问题单：驳回 → 补录 → 改期
const returnProblem: ReturnReview = {
  id: 'TH20260612005',
  orderNo: 'XS20260605012',
  supplementId: 'BZ20260610007',
  customerName: '林女士',
  customerPhone: '139****3372',
  address: '深圳市南山区蛇口鲸山别墅 9 栋',
  applicantId: 'U001',
  applicantName: '王小美',
  applicantRole: 'guide',
  warehouseId: 'U003',
  warehouseName: '张仓管',
  reason: '到货型号与样板册不符，客户要求整批退货。',
  tiles: _tilesReturnProblem,
  totalAmount: _amount(_tilesReturnProblem),
  pickupDate: '2026-06-20',
  inspectionResult: '待验货补录图片凭证。',
  rejectReason: '缺少验货照片，请补录现场凭证后再复核。',
  status: 'rescheduled',
  createdAt: '2026-06-12T15:20:00.000Z',
  updatedAt: '2026-06-15T09:45:00.000Z',
  history: [
    { ..._genHistory('create', '创建退货申请', 'U001', { toStatus: 'pending', remark: '关联补砖单 BZ20260610007，客户反馈马赛克型号与样板不符。' }), timestamp: '2026-06-12T15:20:00.000Z' },
    { ..._genHistory('inspect', '仓库上门验货', 'U003', { fromStatus: 'pending', toStatus: 'inspecting', remark: '首次验货，客户不在场，未能拍照取证。' }), timestamp: '2026-06-13T14:00:00.000Z' },
    { ..._genHistory('reject', '复核驳回', 'U003', { fromStatus: 'inspecting', toStatus: 'rejected', remark: '缺少现场验货照片及拆封对比图，请补录凭证后再提。', changes: [{ field: '驳回原因', oldValue: '', newValue: '缺少验货凭证' }] }), timestamp: '2026-06-14T10:30:00.000Z' },
    { ..._genHistory('supplement', '补录验货凭证', 'U001', { fromStatus: 'rejected', toStatus: 'supplemented', remark: '已上传现场拆封照片 3 张、对比样板册照片 2 张、视频 1 个。', changes: [{ field: '附件数量', oldValue: '0', newValue: '6' }], attachments: [{ name: '现场拆封-1.jpg', url: '#' }, { name: '现场拆封-2.jpg', url: '#' }, { name: '样板对比.jpg', url: '#' }] }), timestamp: '2026-06-14T18:20:00.000Z' },
    { ..._genHistory('reschedule', '客户改期取货', 'U001', { fromStatus: 'supplemented', toStatus: 'rescheduled', remark: '客户外出，原预约 6月16日 取货改到 6月20日。', changes: [{ field: '预约取货日期', oldValue: '2026-06-16', newValue: '2026-06-20' }] }), timestamp: '2026-06-15T09:45:00.000Z' },
  ],
}

export const mockSupplements: SupplementApplication[] = [
  supplementNormal,
  supplementProblem,
  supplementPending,
]

export const mockReturns: ReturnReview[] = [
  returnNormal,
  returnProblem,
]
