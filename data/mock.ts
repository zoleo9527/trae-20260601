import type {
  Customer,
  AccountingTask,
  RiskItem,
  ActivityItem,
  TaxDeadline,
  BillItem,
  Voucher,
  ReviewRecord,
  VoucherEntry
} from '~/types'

export const mockCustomers: Customer[] = [
  {
    id: 'c001',
    name: '杭州智云科技有限公司',
    taxNo: '91330106MA2XXXXXX1',
    industry: '软件和信息技术服务业',
    scale: '小规模',
    accountManager: '王芳',
    accountant: '李明',
    reviewer: '张伟',
    monthlyFee: 800,
    riskLevel: 'normal',
    tags: ['零申报风险', '新签客户']
  },
  {
    id: 'c002',
    name: '上海诚达贸易有限公司',
    taxNo: '91310115MA1XXXXXX2',
    industry: '批发和零售业',
    scale: '一般纳税人',
    accountManager: '王芳',
    accountant: '李明',
    reviewer: '张伟',
    monthlyFee: 1500,
    riskLevel: 'attention',
    tags: ['票据缺失', '银行流水大']
  },
  {
    id: 'c003',
    name: '南京优品餐饮管理有限公司',
    taxNo: '91320104MA3XXXXXX3',
    industry: '餐饮业',
    scale: '小规模',
    accountManager: '刘强',
    accountant: '陈静',
    reviewer: '张伟',
    monthlyFee: 600,
    riskLevel: 'high',
    tags: ['个税高风险', '票据混乱']
  },
  {
    id: 'c004',
    name: '苏州恒远建筑工程有限公司',
    taxNo: '91320506MA1XXXXXX4',
    industry: '建筑业',
    scale: '一般纳税人',
    accountManager: '刘强',
    accountant: '陈静',
    reviewer: '赵敏',
    monthlyFee: 2500,
    riskLevel: 'normal',
    tags: ['合同多', '进项票管理']
  },
  {
    id: 'c005',
    name: '宁波启明星教育咨询有限公司',
    taxNo: '91330205MA2XXXXXX5',
    industry: '教育',
    scale: '小规模',
    accountManager: '王芳',
    accountant: '李明',
    reviewer: '赵敏',
    monthlyFee: 500,
    riskLevel: 'normal',
    tags: ['季度申报']
  },
  {
    id: 'c006',
    name: '合肥瑞康医疗器械有限公司',
    taxNo: '91340100MA3XXXXXX6',
    industry: '医疗器械',
    scale: '一般纳税人',
    accountManager: '刘强',
    accountant: '陈静',
    reviewer: '赵敏',
    monthlyFee: 2000,
    riskLevel: 'attention',
    tags: ['库存复杂', '合规要求高']
  },
  {
    id: 'c007',
    name: '温州速达物流有限公司',
    taxNo: '91330302MA2XXXXXX7',
    industry: '物流运输业',
    scale: '一般纳税人',
    accountManager: '王芳',
    accountant: '李明',
    reviewer: '张伟',
    monthlyFee: 1800,
    riskLevel: 'attention',
    tags: ['发票多', '进项票待收']
  },
  {
    id: 'c008',
    name: '无锡新意文化传媒有限公司',
    taxNo: '91320214MA1XXXXXX8',
    industry: '文化传媒',
    scale: '小规模',
    accountManager: '刘强',
    accountant: '陈静',
    reviewer: '张伟',
    monthlyFee: 700,
    riskLevel: 'normal',
    tags: ['文化事业建设费']
  }
]

const makeBills = (seed: number): BillItem[] => {
  const base: BillItem[] = [
    { id: `b${seed}1`, type: '进项增值税发票', amount: 125800, count: 8, uploadedAt: '2026-05-28 14:20', uploader: '王芳', note: '客户通过微信上传' },
    { id: `b${seed}2`, type: '销项增值税发票', amount: 186400, count: 12, uploadedAt: '2026-05-29 09:15', uploader: '王芳' },
    { id: `b${seed}3`, type: '费用类发票', amount: 23400, count: 15, uploadedAt: '2026-05-29 16:40', uploader: '李明', note: '含餐饮、差旅、办公费' },
    { id: `b${seed}4`, type: '银行回单', amount: 0, count: 24, uploadedAt: '2026-05-30 10:05', uploader: '李明' },
    { id: `b${seed}5`, type: '工资表', amount: 0, count: 1, uploadedAt: '2026-05-30 11:30', uploader: '客户' }
  ]
  return base.slice(0, 3 + (seed % 3))
}

const makeEntries = (seed: number): VoucherEntry[] => [
  { id: `e${seed}1`, summary: '销售收入确认', debitAccount: '应收账款', debitAmount: 186400, creditAccount: '主营业务收入', creditAmount: 164955.75, note: '按发票明细逐笔录入' },
  { id: `e${seed}2`, summary: '采购入库', debitAccount: '库存商品', debitAmount: 108620.69, creditAccount: '应付账款', creditAmount: 125800 },
  { id: `e${seed}3`, summary: '5月办公费用', debitAccount: '管理费用-办公费', debitAmount: 8400, creditAccount: '银行存款', creditAmount: 8400 },
  { id: `e${seed}4`, summary: '5月差旅费用', debitAccount: '管理费用-差旅费', debitAmount: 6200, creditAccount: '其他应收款', creditAmount: 6200 },
  { id: `e${seed}5`, summary: '计提5月工资', debitAccount: '管理费用-工资', debitAmount: 58000, creditAccount: '应付职工薪酬', creditAmount: 58000, note: '附工资表' }
]

const makeVouchers = (seed: number, count: number): Voucher[] => {
  const list: Voucher[] = []
  for (let i = 0; i < count; i++) {
    list.push({
      id: `v${seed}${i + 1}`,
      voucherNo: `记-${String(10 + i).padStart(3, '0')}`,
      date: `2026-05-${String(10 + i * 3).padStart(2, '0')}`,
      entries: makeEntries(seed * 10 + i),
      createdBy: seed % 2 === 0 ? '李明' : '陈静',
      createdAt: `2026-05-3${i % 2} 1${i % 8}:${15 + i * 7}`,
      attachedBillIds: [`b${seed}1`, `b${seed}${2 + (i % 3)}`],
      status: i < count - 1 ? 'reviewed' : 'submitted'
    })
  }
  return list
}

const reviewRecords: Record<string, ReviewRecord[]> = {
  t001: [
    { id: 'r1', reviewer: '李明', role: 'accountant', action: 'submit', at: '2026-06-01 14:32', comment: '5月凭证已录入完成，共46张，附票据60张，请复核' },
    { id: 'r2', reviewer: '张伟', role: 'supervisor', action: 'reject', at: '2026-06-02 10:15', comment: '有3张凭证科目使用有误，详见问题列表', issues: [
      { field: '记-028', description: '员工个人消费发票计入管理费用-福利费，应计入业务招待费', severity: 'warning' },
      { field: '记-035', description: '预付房租摊销期计算有误，多摊销1个月', severity: 'error' },
      { field: '记-042', description: '银行手续费缺少银行回单附件', severity: 'warning' }
    ]}
  ],
  t002: [
    { id: 'r3', reviewer: '王芳', role: 'manager', action: 'submit', at: '2026-06-01 09:40', comment: '客户票据已上传完毕，进项12张、销项18张、费用类22张，银行回单齐全' },
    { id: 'r4', reviewer: '李明', role: 'accountant', action: 'submit', at: '2026-06-02 16:50', comment: '账务处理完成，凭证共52张，已核对银行流水，请复核' },
    { id: 'r5', reviewer: '张伟', role: 'supervisor', action: 'pass', at: '2026-06-03 11:20', comment: '复核通过，税负率正常，凭证附件齐全' }
  ],
  t004: [
    { id: 'r6', reviewer: '陈静', role: 'accountant', action: 'submit', at: '2026-06-02 15:08', comment: '5月凭证38张，已完成，请复核' }
  ],
  t005: [
    { id: 'r7', reviewer: '李明', role: 'accountant', action: 'rework', at: '2026-06-03 09:00', comment: '正在修正上次驳回的3个问题，预计今日完成' }
  ]
}

export const mockTasks: AccountingTask[] = [
  {
    id: 't001',
    period: '2026-05',
    customerId: 'c001',
    customer: mockCustomers[0],
    status: 'review_reject',
    bills: makeBills(1),
    vouchers: makeVouchers(1, 46),
    currentHandler: '李明',
    deadline: '2026-06-08',
    reviewRecords: reviewRecords.t001,
    hasRisk: false,
    overdue: false
  },
  {
    id: 't002',
    period: '2026-05',
    customerId: 'c002',
    customer: mockCustomers[1],
    status: 'review_pass',
    bills: makeBills(2),
    vouchers: makeVouchers(2, 52),
    currentHandler: '张伟',
    deadline: '2026-06-08',
    reviewRecords: reviewRecords.t002,
    hasRisk: true,
    riskNote: '进项发票缺3张，客户承诺6月5日前补齐',
    overdue: false
  },
  {
    id: 't003',
    period: '2026-05',
    customerId: 'c003',
    customer: mockCustomers[2],
    status: 'pending_accounting',
    bills: makeBills(3),
    vouchers: [],
    currentHandler: '陈静',
    deadline: '2026-06-08',
    reviewRecords: [],
    hasRisk: true,
    riskNote: '个税申报数据异常，需与客户确认工资明细',
    overdue: false
  },
  {
    id: 't004',
    period: '2026-05',
    customerId: 'c004',
    customer: mockCustomers[3],
    status: 'pending_review',
    bills: makeBills(4),
    vouchers: makeVouchers(4, 38),
    currentHandler: '赵敏',
    deadline: '2026-06-08',
    reviewRecords: reviewRecords.t004,
    hasRisk: false,
    overdue: false
  },
  {
    id: 't005',
    period: '2026-05',
    customerId: 'c005',
    customer: mockCustomers[4],
    status: 'accounting',
    bills: makeBills(5),
    vouchers: makeVouchers(5, 18),
    currentHandler: '李明',
    deadline: '2026-06-08',
    reviewRecords: reviewRecords.t005,
    hasRisk: false,
    overdue: false
  },
  {
    id: 't006',
    period: '2026-05',
    customerId: 'c006',
    customer: mockCustomers[5],
    status: 'pending_bill',
    bills: makeBills(6).slice(0, 2),
    vouchers: [],
    currentHandler: '刘强',
    deadline: '2026-06-08',
    reviewRecords: [],
    hasRisk: true,
    riskNote: '距申报截止5天，票据仍缺60%以上',
    overdue: false
  },
  {
    id: 't007',
    period: '2026-05',
    customerId: 'c007',
    customer: mockCustomers[6],
    status: 'pending_review',
    bills: makeBills(7),
    vouchers: makeVouchers(7, 44),
    currentHandler: '张伟',
    deadline: '2026-06-05',
    reviewRecords: [],
    hasRisk: false,
    overdue: true
  },
  {
    id: 't008',
    period: '2026-05',
    customerId: 'c008',
    customer: mockCustomers[7],
    status: 'completed',
    bills: makeBills(8),
    vouchers: makeVouchers(8, 28),
    currentHandler: '-',
    deadline: '2026-06-08',
    reviewRecords: [
      { id: 'r8', reviewer: '陈静', role: 'accountant', action: 'submit', at: '2026-05-30 17:30', comment: '5月凭证已完成' },
      { id: 'r9', reviewer: '张伟', role: 'supervisor', action: 'pass', at: '2026-06-01 10:15', comment: '复核通过' },
      { id: 'r10', reviewer: '王芳', role: 'manager', action: 'complete', at: '2026-06-02 14:00', comment: '已完成申报并通知客户' }
    ],
    hasRisk: false,
    overdue: false
  }
]

export const mockRisks: RiskItem[] = [
  {
    id: 'rk001',
    customerId: 'c003',
    customerName: '南京优品餐饮管理有限公司',
    type: 'missing_bill',
    level: 'high',
    title: '工资表与社保基数不一致',
    description: '5月工资表申报基数与社保缴纳基数偏差超过30%，可能触发个税稽查风险',
    relatedTaskId: 't003',
    updatedAt: '2026-06-03 09:45'
  },
  {
    id: 'rk002',
    customerId: 'c006',
    customerName: '合肥瑞康医疗器械有限公司',
    type: 'missing_bill',
    level: 'high',
    title: '票据收集严重滞后',
    description: '距6月申报截止仅5天，进项票仅收集30%，销项票收集40%，存在逾期申报风险',
    relatedTaskId: 't006',
    updatedAt: '2026-06-03 08:30'
  },
  {
    id: 'rk003',
    customerId: 'c007',
    customerName: '温州速达物流有限公司',
    type: 'overdue',
    level: 'high',
    title: '账务处理已逾期',
    description: '原计划6月5日前完成复核，当前仍在待复核状态，已逾期1天',
    relatedTaskId: 't007',
    updatedAt: '2026-06-06 00:00'
  },
  {
    id: 'rk004',
    customerId: 'c002',
    customerName: '上海诚达贸易有限公司',
    type: 'missing_bill',
    level: 'medium',
    title: '进项发票缺失3张',
    description: '采购入库凭证对应3张进项发票尚未收到，客户承诺6月5日前补齐',
    relatedTaskId: 't002',
    updatedAt: '2026-06-02 16:10'
  },
  {
    id: 'rk005',
    customerId: 'c001',
    customerName: '杭州智云科技有限公司',
    type: 'reject_times',
    level: 'medium',
    title: '凭证复核被驳回',
    description: '包含科目错误3项：科目误用1条、摊销计算错误1条、附件缺失1条',
    relatedTaskId: 't001',
    updatedAt: '2026-06-02 10:15'
  }
]

export const mockActivities: ActivityItem[] = [
  { id: 'a1', user: '张伟', role: 'supervisor', action: '驳回复核', customerName: '杭州智云科技有限公司', target: '任务 #t001', at: '2026-06-02 10:15' },
  { id: 'a2', user: '李明', role: 'accountant', action: '提交凭证', customerName: '上海诚达贸易有限公司', target: '52张凭证', at: '2026-06-02 16:50' },
  { id: 'a3', user: '张伟', role: 'supervisor', action: '复核通过', customerName: '上海诚达贸易有限公司', target: '任务 #t002', at: '2026-06-03 11:20' },
  { id: 'a4', user: '王芳', role: 'manager', action: '上传票据', customerName: '杭州智云科技有限公司', target: '15张费用票', at: '2026-06-01 14:05' },
  { id: 'a5', user: '陈静', role: 'accountant', action: '提交凭证', customerName: '苏州恒远建筑工程有限公司', target: '38张凭证', at: '2026-06-02 15:08' },
  { id: 'a6', user: '刘强', role: 'manager', action: '催交票据', customerName: '合肥瑞康医疗器械有限公司', target: '电话通知', at: '2026-06-03 08:30' }
]

export const mockDeadlines: TaxDeadline[] = [
  {
    id: 'd1',
    period: '2026年5月',
    taxType: '增值税 / 附加税 / 企业所得税（预缴）',
    deadline: '2026-06-15',
    customers: [
      { id: 'c008', name: '无锡新意文化传媒', status: 'done' },
      { id: 'c002', name: '上海诚达贸易', status: 'done' },
      { id: 'c007', name: '温州速达物流', status: 'risk' },
      { id: 'c004', name: '苏州恒远建筑', status: 'pending' },
      { id: 'c005', name: '宁波启明星教育', status: 'pending' },
      { id: 'c001', name: '杭州智云科技', status: 'pending' },
      { id: 'c003', name: '南京优品餐饮', status: 'risk' },
      { id: 'c006', name: '合肥瑞康医疗', status: 'risk' }
    ]
  }
]

export const roleMenus: Record<string, { key: string; label: string; badge?: string; badgeType?: 'danger' | 'warning' | 'info' }[]> = {
  accountant: [
    { key: 'todo', label: '我的待办', badge: '12', badgeType: 'danger' },
    { key: 'accounting', label: '账务处理', badge: '4', badgeType: 'warning' },
    { key: 'rework', label: '驳回修正', badge: '2', badgeType: 'danger' },
    { key: 'completed', label: '本月完成' }
  ],
  manager: [
    { key: 'todo', label: '我的待办', badge: '8', badgeType: 'danger' },
    { key: 'bill_collect', label: '票据催收', badge: '5', badgeType: 'warning' },
    { key: 'upload', label: '票据录入', badge: '3', badgeType: 'info' },
    { key: 'communicate', label: '客户沟通' }
  ],
  supervisor: [
    { key: 'todo', label: '我的待办', badge: '6', badgeType: 'danger' },
    { key: 'review', label: '凭证复核', badge: '5', badgeType: 'warning' },
    { key: 'risk', label: '风险监控', badge: '2', badgeType: 'danger' },
    { key: 'report', label: '月报汇总' }
  ]
}
