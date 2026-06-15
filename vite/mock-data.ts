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
  { id: 'guide-001', name: '李小美', role: 'guide', roleName: '导购' },
  { id: 'designer-001', name: '王设计', role: 'designer', roleName: '设计师' },
  { id: 'warehouse-001', name: '张仓管', role: 'warehouse', roleName: '仓库员' },
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

function _user(id: string): UserInfo {
  return USERS.find(u => u.id === id)!
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
    timestamp: new Date().toISOString(),
    ...opts,
  }
}

export function _amount(tiles: TileItem[]): number {
  return tiles.reduce((s, t) => s + t.quantity * t.unitPrice, 0)
}

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

export const mockSupplements: SupplementApplication[] = [
  {
    id: 'BZ20260601001',
    orderNo: 'XS20260528008',
    customerName: '陈先生',
    customerPhone: '138****6688',
    address: '朝阳区阳光花园 3 栋 1202',
    projectName: '阳光花园家装',
    guideId: 'guide-001',
    guideName: '李小美',
    source: 'sample_book',
    sourceLabel: '样板册',
    sourceRefNo: 'YB-A-023',
    reason: '初测数量不够，客厅需要追加',
    tiles: _tilesNormal,
    totalAmount: _amount(_tilesNormal),
    expectedDeliveryDate: '2026-06-10',
    status: 'pending',
    createdAt: '2026-06-01T09:30:00.000Z',
    updatedAt: '2026-06-01T09:30:00.000Z',
    history: [
      _genHistory('create', '创建补砖申请', 'guide-001', {
        changes: [
          { field: '补砖原因', oldValue: '', newValue: '初测数量不够，客厅需要追加' },
          { field: '期望送达日期', oldValue: '', newValue: '2026-06-10' },
          { field: '瓷砖数量', oldValue: '', newValue: '176' },
        ],
      }),
    ],
  },
  {
    id: 'BZ20260530002',
    orderNo: 'XS20260520015',
    customerName: '刘女士',
    customerPhone: '139****2233',
    address: '海淀区学府苑 5 栋 801',
    projectName: '学府苑旧房改造',
    guideId: 'guide-001',
    guideName: '李小美',
    designerId: 'designer-001',
    designerName: '王设计',
    source: 'measurement_sheet',
    sourceLabel: '量房单',
    sourceRefNo: 'LF-2026-0512',
    reason: '厨房墙砖量错了，需要补',
    tiles: _tilesProblem,
    totalAmount: _amount(_tilesProblem),
    expectedDeliveryDate: '2026-06-15',
    status: 'rescheduled',
    createdAt: '2026-05-30T14:20:00.000Z',
    updatedAt: '2026-06-02T16:00:00.000Z',
    history: [
      _genHistory('create', '创建补砖申请', 'guide-001', {
        timestamp: '2026-05-30T14:20:00.000Z',
        changes: [
          { field: '补砖原因', oldValue: '', newValue: '厨房墙砖量错了，需要补' },
          { field: '期望送达日期', oldValue: '', newValue: '2026-06-08' },
          { field: '瓷砖数量', oldValue: '', newValue: '100' },
        ],
      }),
      _genHistory('submit', '提交设计师复核', 'guide-001', {
        timestamp: '2026-05-30T15:00:00.000Z',
        fromStatus: 'pending',
        toStatus: 'designing',
      }),
      _genHistory('start_design', '开始量房设计', 'designer-001', {
        timestamp: '2026-05-31T09:00:00.000Z',
        fromStatus: 'designing',
        toStatus: 'designing',
        remark: '下午上门量房',
      }),
      _genHistory('reject', '驳回：量房数据有差异', 'designer-001', {
        timestamp: '2026-05-31T17:30:00.000Z',
        fromStatus: 'designing',
        toStatus: 'rejected',
        changes: [{ field: '驳回原因', oldValue: '', newValue: '厨房实际面积与申报不符，需重新核对瓷砖用量' }],
      }),
      _genHistory('supplement', '补录信息', 'guide-001', {
        timestamp: '2026-06-01T10:00:00.000Z',
        fromStatus: 'rejected',
        toStatus: 'supplemented',
        remark: '已重新核算数量，增加了 12 片马赛克',
        changes: [
          { field: '瓷砖数量', oldValue: '100', newValue: '112' },
          { field: '总金额', oldValue: '¥15,104', newValue: '¥16,064' },
        ],
      }),
      _genHistory('reschedule', '改期', 'guide-001', {
        timestamp: '2026-06-02T16:00:00.000Z',
        fromStatus: 'supplemented',
        toStatus: 'rescheduled',
        remark: '客户装修进度延期',
        changes: [{ field: '期望送达日期', oldValue: '2026-06-08', newValue: '2026-06-15' }],
      }),
    ],
  },
  {
    id: 'BZ20260525003',
    orderNo: 'XS20260510003',
    customerName: '赵总',
    customerPhone: '186****8888',
    address: '西山区云顶别墅 A 区 8 号',
    projectName: '云顶别墅精装修',
    guideId: 'guide-001',
    guideName: '李小美',
    designerId: 'designer-001',
    designerName: '王设计',
    source: 'replenish_form',
    sourceLabel: '补货申请单',
    sourceRefNo: 'BH-2026-025',
    reason: '施工损耗超出预期',
    tiles: [
      { sku: 'TL-005', name: '微水泥地砖', spec: '600x1200mm', color: '暖灰', unit: '片', quantity: 45, unitPrice: 256, remark: '全屋通铺补货' },
    ],
    totalAmount: 11520,
    expectedDeliveryDate: '2026-06-05',
    actualDeliveryDate: '2026-06-04',
    status: 'completed',
    createdAt: '2026-05-25T11:00:00.000Z',
    updatedAt: '2026-06-04T14:30:00.000Z',
    history: [
      _genHistory('create', '创建补砖申请', 'guide-001', {
        timestamp: '2026-05-25T11:00:00.000Z',
        changes: [
          { field: '补砖原因', oldValue: '', newValue: '施工损耗超出预期' },
          { field: '期望送达日期', oldValue: '', newValue: '2026-06-05' },
          { field: '瓷砖数量', oldValue: '', newValue: '45' },
        ],
      }),
      _genHistory('submit', '提交设计师复核', 'guide-001', {
        timestamp: '2026-05-25T11:30:00.000Z',
        fromStatus: 'pending',
        toStatus: 'designing',
      }),
      _genHistory('confirm_design', '设计师复核通过', 'designer-001', {
        timestamp: '2026-05-26T09:00:00.000Z',
        fromStatus: 'designing',
        toStatus: 'confirmed',
        remark: '数量核对无误，安排备货',
      }),
      _genHistory('start_warehouse', '仓库开始备货', 'warehouse-001', {
        timestamp: '2026-06-02T08:30:00.000Z',
        fromStatus: 'confirmed',
        toStatus: 'warehousing',
      }),
      _genHistory('ship', '安排发货', 'warehouse-001', {
        timestamp: '2026-06-03T10:00:00.000Z',
        fromStatus: 'warehousing',
        toStatus: 'shipped',
        remark: '顺丰速运 SF1234567890',
      }),
      _genHistory('complete', '客户签收完成', 'guide-001', {
        timestamp: '2026-06-04T14:30:00.000Z',
        fromStatus: 'shipped',
        toStatus: 'completed',
        remark: '数量无误，包装完好',
      }),
    ],
  },
]

export const mockReturns: ReturnReview[] = [
  {
    id: 'TH20260602001',
    orderNo: 'XS20260525010',
    supplementId: 'BZ20260525003',
    customerName: '赵总',
    customerPhone: '186****8888',
    address: '西山区云顶别墅 A 区 8 号',
    applicantId: 'guide-001',
    applicantName: '李小美',
    applicantRole: 'guide',
    reason: '多送了 5 片，客户要求退回',
    tiles: [
      { sku: 'TL-005', name: '微水泥地砖', spec: '600x1200mm', color: '暖灰', unit: '片', quantity: 5, unitPrice: 256, remark: '多送货退回' },
    ],
    totalAmount: 1280,
    pickupDate: '2026-06-08',
    status: 'pending',
    createdAt: '2026-06-02T15:00:00.000Z',
    updatedAt: '2026-06-02T15:00:00.000Z',
    history: [
      _genHistory('create', '创建退货申请', 'guide-001', {
        changes: [
          { field: '退货原因', oldValue: '', newValue: '多送了 5 片，客户要求退回' },
          { field: '预约取货日期', oldValue: '', newValue: '2026-06-08' },
          { field: '退货数量', oldValue: '', newValue: '5' },
        ],
      }),
    ],
  },
  {
    id: 'TH20260528002',
    orderNo: 'XS20260515007',
    customerName: '周女士',
    customerPhone: '137****5566',
    address: '东城区东方明珠 2 栋 1503',
    applicantId: 'guide-001',
    applicantName: '李小美',
    applicantRole: 'guide',
    warehouseId: 'warehouse-001',
    warehouseName: '张仓管',
    reason: '色差严重，与样板不符',
    tiles: _tilesReturnProblem,
    totalAmount: _amount(_tilesReturnProblem),
    pickupDate: '2026-06-12',
    rejectReason: '缺少购货凭证',
    status: 'rejected',
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-30T14:00:00.000Z',
    history: [
      _genHistory('create', '创建退货申请', 'guide-001', {
        timestamp: '2026-05-28T10:00:00.000Z',
        changes: [
          { field: '退货原因', oldValue: '', newValue: '色差严重，与样板不符' },
          { field: '预约取货日期', oldValue: '', newValue: '2026-06-02' },
          { field: '退货数量', oldValue: '', newValue: '18' },
        ],
      }),
      _genHistory('inspect', '启动仓库验货', 'warehouse-001', {
        timestamp: '2026-05-29T09:00:00.000Z',
        fromStatus: 'pending',
        toStatus: 'inspecting',
        remark: '安排下午上门验货',
      }),
      _genHistory('reject', '驳回：缺少购货凭证', 'warehouse-001', {
        timestamp: '2026-05-30T14:00:00.000Z',
        fromStatus: 'inspecting',
        toStatus: 'rejected',
        changes: [{ field: '驳回原因', oldValue: '', newValue: '无法确认是本店售出商品，请补充购货凭证' }],
      }),
    ],
  },
  {
    id: 'TH20260520003',
    orderNo: 'XS20260508005',
    customerName: '孙先生',
    customerPhone: '135****7788',
    address: '南湖区南湖春晓 6 栋 302',
    applicantId: 'guide-001',
    applicantName: '李小美',
    applicantRole: 'guide',
    warehouseId: 'warehouse-001',
    warehouseName: '张仓管',
    inspectionResult: '包装完好，数量正确，瓷砖无破损',
    reason: '装修方案变更，用不上了',
    tiles: _tilesReturn,
    totalAmount: _amount(_tilesReturn),
    pickupDate: '2026-06-01',
    refundAmount: 1504,
    status: 'refunded',
    createdAt: '2026-05-20T14:00:00.000Z',
    updatedAt: '2026-05-26T10:00:00.000Z',
    history: [
      _genHistory('create', '创建退货申请', 'guide-001', {
        timestamp: '2026-05-20T14:00:00.000Z',
        changes: [
          { field: '退货原因', oldValue: '', newValue: '装修方案变更，用不上了' },
          { field: '预约取货日期', oldValue: '', newValue: '2026-05-25' },
          { field: '退货数量', oldValue: '', newValue: '8' },
        ],
      }),
      _genHistory('inspect', '启动仓库验货', 'warehouse-001', {
        timestamp: '2026-05-22T09:00:00.000Z',
        fromStatus: 'pending',
        toStatus: 'inspecting',
      }),
      _genHistory('pass', '复核通过', 'warehouse-001', {
        timestamp: '2026-05-23T15:00:00.000Z',
        fromStatus: 'inspecting',
        toStatus: 'confirmed',
        remark: '货物完好，符合退货条件',
        changes: [{ field: '验货结果', oldValue: '', newValue: '包装完好，数量正确' }],
      }),
      _genHistory('refund', '退款完成', 'guide-001', {
        timestamp: '2026-05-26T10:00:00.000Z',
        fromStatus: 'confirmed',
        toStatus: 'refunded',
        remark: '已原路退回 1504 元',
        changes: [{ field: '退款金额', oldValue: '', newValue: '¥1,504' }],
      }),
    ],
  },
]
