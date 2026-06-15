import dayjs from 'dayjs'

const today = dayjs()
const yesterday = today.subtract(1, 'day')
const twoDaysAgo = today.subtract(2, 'day')
const threeDaysAgo = today.subtract(3, 'day')

export const arrivals = [
  {
    id: 'ARR-20260615-001',
    status: 'pending',
    supplier: '深圳华强北电子批发城',
    supplierContact: '黄经理 13800138001',
    poNo: 'PO-20260612-087',
    expectedDate: today.format('YYYY-MM-DD'),
    actualDate: null,
    receivedBy: null,
    totalItems: 12,
    checkedItems: 0,
    totalCost: 45680,
    items: [
      { partId: 'CPU-001', name: 'Intel i7-14700K', qty: 2, unitCost: 3150, batchCode: 'INT-2026-W24-015A', received: 0, note: '原封盒包' },
      { partId: 'CPU-002', name: 'AMD Ryzen 7 7800X3D', qty: 3, unitCost: 3080, batchCode: 'AMD-2026-W24-088C', received: 0, note: '' },
      { partId: 'GPU-001', name: 'NVIDIA RTX 4070 Ti 12G', qty: 2, unitCost: 6150, batchCode: 'NV-2026-MSC-3342', received: 0, note: '微星VENTUS版' },
      { partId: 'SSD-001', name: '三星 990 Pro 2TB NVMe', qty: 5, unitCost: 1420, batchCode: 'SAMS-Q2-2026-11208', received: 0, note: '' }
    ],
    anomaly: null,
    createdAt: yesterday.format('YYYY-MM-DD HH:mm'),
    history: [
      { time: yesterday.format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '创建到货单', detail: '关联订单SO-20260612-003' },
      { time: yesterday.add(2, 'hour').format('YYYY-MM-DD HH:mm'), operator: '系统', action: '确认供应商发货', detail: '物流单号: SF1234567890' }
    ]
  },
  {
    id: 'ARR-20260615-002',
    status: 'partial',
    supplier: '广州金河田代理商',
    supplierContact: '林主管 13900139002',
    poNo: 'PO-20260611-083',
    expectedDate: yesterday.format('YYYY-MM-DD'),
    actualDate: today.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    receivedBy: '王仓管',
    totalItems: 8,
    checkedItems: 6,
    totalCost: 12560,
    items: [
      { partId: 'PSU-001', name: '海韵 FOCUS GX-850W 金牌全模', qty: 3, unitCost: 950, batchCode: 'SS-FGX-202605-B3', received: 3, note: '' },
      { partId: 'CASE-001', name: '联力 O11 Dynamic EVO', qty: 2, unitCost: 1200, batchCode: 'LL-O11-2026-MAY-178', received: 2, note: '' },
      { partId: 'COOL-001', name: '利民 Frozen MAGIC 360 ARGB', qty: 3, unitCost: 370, batchCode: 'TR-FM360-0608', received: 1, note: '少2个，已与供应商沟通补发' }
    ],
    anomaly: {
      type: 'shortage',
      level: 'warning',
      title: '配件数量短缺',
      description: '利民水冷少2件，供应商承诺今日补发',
      reportedBy: '王仓管',
      reportedAt: today.subtract(4, 'hour').format('YYYY-MM-DD HH:mm'),
      status: 'processing'
    },
    createdAt: twoDaysAgo.format('YYYY-MM-DD HH:mm'),
    history: [
      { time: twoDaysAgo.format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '创建采购订单', detail: 'PO-20260611-083' },
      { time: today.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '开始验收', detail: '签收外包装完好' },
      { time: today.subtract(4, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '上报异常', detail: '利民水冷缺少2件，已拍照' },
      { time: today.subtract(3, 'hour').format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '确认异常', detail: '联系供应商补发' }
    ]
  },
  {
    id: 'ARR-20260614-001',
    status: 'completed',
    supplier: '上海恩杰授权分销商',
    supplierContact: '赵总 13700137003',
    poNo: 'PO-20260610-079',
    expectedDate: twoDaysAgo.format('YYYY-MM-DD'),
    actualDate: twoDaysAgo.add(5, 'hour').format('YYYY-MM-DD HH:mm'),
    receivedBy: '王仓管',
    totalItems: 6,
    checkedItems: 6,
    totalCost: 15594,
    items: [
      { partId: 'COOL-002', name: '恩杰 Kraken X73 RGB 360', qty: 3, unitCost: 1050, batchCode: 'NZXT-KX3-2026W23', received: 3, note: '包装良好' },
      { partId: 'PSU-002', name: '海盗船 RM850x 金牌全模', qty: 3, unitCost: 1048, batchCode: 'CORS-RM850X-062026', received: 3, note: '' }
    ],
    anomaly: null,
    createdAt: threeDaysAgo.format('YYYY-MM-DD HH:mm'),
    history: [
      { time: threeDaysAgo.format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '创建采购订单', detail: 'PO-20260610-079' },
      { time: twoDaysAgo.add(5, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '完成验收', detail: '全部6件配件正常入库' }
    ]
  },
  {
    id: 'ARR-20260613-001',
    status: 'completed',
    supplier: '北京华硕总代理',
    supplierContact: '钱经理 13600136004',
    poNo: 'PO-20260609-072',
    expectedDate: threeDaysAgo.format('YYYY-MM-DD'),
    actualDate: threeDaysAgo.add(4, 'hour').format('YYYY-MM-DD HH:mm'),
    receivedBy: '王仓管',
    totalItems: 10,
    checkedItems: 10,
    totalCost: 41871,
    items: [
      { partId: 'MB-001', name: '华硕 ROG STRIX Z790-A', qty: 5, unitCost: 2650, batchCode: 'ASUS-Z790A-06W2', received: 5, note: '' },
      { partId: 'RAM-001', name: '芝奇 Trident Z5 32GB DDR5 6400', qty: 5, unitCost: 860, batchCode: 'GSK-DDR5-6400-0610', received: 5, note: '' }
    ],
    anomaly: {
      type: 'defective',
      level: 'danger',
      title: '主板批次存疑',
      description: '到货批次 ASUS-Z790A-06W2 上周已有3起蓝屏返修记录，请装机前注意检测',
      reportedBy: '客服小周',
      reportedAt: twoDaysAgo.add(2, 'hour').format('YYYY-MM-DD HH:mm'),
      status: 'warning'
    },
    createdAt: threeDaysAgo.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    history: [
      { time: threeDaysAgo.subtract(1, 'day').format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '创建采购订单', detail: '根据客户订单补货' },
      { time: threeDaysAgo.add(4, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '完成验收', detail: '全部配件入库' },
      { time: twoDaysAgo.add(2, 'hour').format('YYYY-MM-DD HH:mm'), operator: '客服小周', action: '关联返修记录', detail: '批次Z790A-06W2关联3起蓝屏返修' },
      { time: twoDaysAgo.add(3, 'hour').format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '设置批次预警', detail: '装机前必须做压力测试' }
    ]
  }
]
