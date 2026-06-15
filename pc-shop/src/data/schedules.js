import dayjs from 'dayjs'

const today = dayjs()
const yesterday = today.subtract(1, 'day')
const twoDaysAgo = today.subtract(2, 'day')
const tomorrow = today.add(1, 'day')
const dayAfterTomorrow = today.add(2, 'day')

export const schedules = [
  {
    id: 'SO-20260615-001',
    customerName: '刘先生',
    customerPhone: '138****5678',
    usageType: '游戏主机',
    totalAmount: 15592,
    paidAmount: 9000,
    remainingAmount: 6592,
    status: 'parts_missing',
    technician: null,
    salesPerson: '小李',
    createdAt: yesterday.format('YYYY-MM-DD HH:mm'),
    expectedComplete: tomorrow.format('YYYY-MM-DD'),
    actualComplete: null,
    urgent: true,
    partsReady: 4,
    partsTotal: 8,
    priceChanged: true,
    priceChangeDiff: 3200,
    hasBlueScreenHistory: false,
    anomaly: {
      type: 'price_change',
      level: 'warning',
      title: '配置变更漏算价 ¥3,200',
      description: 'SO-20260615-001 客户将显卡从 RTX 4060 Ti 升级至 RTX 4070 Ti，销售未更新报价单，差价 ¥3,200 未收取',
      reportedAt: today.subtract(1, 'hour').format('YYYY-MM-DD HH:mm'),
      operator: '系统'
    },
    config: [
      { partId: 'CPU-001', name: 'Intel i7-14700K', originalPrice: 3299, currentPrice: 3299, qty: 1, note: '' },
      { partId: 'MB-001', name: '华硕 ROG STRIX Z790-A', originalPrice: 2799, currentPrice: 2799, qty: 1, note: '' },
      { partId: 'RAM-001', name: '芝奇 Trident Z5 32GB DDR5 6400', originalPrice: 899, currentPrice: 899, qty: 1, note: '' },
      { partId: 'SSD-001', name: '三星 990 Pro 2TB NVMe', originalPrice: 1499, currentPrice: 1499, qty: 1, note: '' },
      { partId: 'GPU-001', name: 'NVIDIA RTX 4070 Ti 12G', originalPrice: 3299, currentPrice: 6499, qty: 1, note: '客户要求升级，原RTX4060Ti已出库' },
      { partId: 'PSU-001', name: '海韵 FOCUS GX-850W 金牌全模', originalPrice: 999, currentPrice: 999, qty: 1, note: '' },
      { partId: 'CASE-001', name: '联力 O11 Dynamic EVO', originalPrice: 1299, currentPrice: 1299, qty: 1, note: '' },
      { partId: 'COOL-001', name: '利民 Frozen MAGIC 360 ARGB', originalPrice: 399, currentPrice: 399, qty: 1, note: '' }
    ],
    arrivalsRef: ['ARR-20260615-001', 'ARR-20260614-001'],
    history: [
      { time: yesterday.format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '创建订单', detail: '初始配置总价 ¥15,592，付定金 ¥9,000，欠款 ¥6,592' },
      { time: yesterday.add(3, 'hour').format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '修改配置', detail: '显卡由 RTX 4060 Ti 升级为 RTX 4070 Ti（差价 ¥3,200）' },
      { time: today.subtract(1, 'hour').format('YYYY-MM-DD HH:mm'), operator: '系统', action: '价格异常检测', detail: '配置已变更但报价未更新，漏记差价 ¥3,200' },
      { time: today.format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '配件出库', detail: 'CPU/主板/内存/SSD 4件已出库，显卡等下午到货' }
    ]
  },
  {
    id: 'SO-20260615-002',
    customerName: '游戏工作室-王总',
    customerPhone: '139****2234',
    usageType: '工作渲染',
    totalAmount: 24999,
    paidAmount: 24999,
    remainingAmount: 0,
    status: 'in_progress',
    technician: '陈工',
    salesPerson: '张店长',
    createdAt: twoDaysAgo.format('YYYY-MM-DD HH:mm'),
    expectedComplete: today.format('YYYY-MM-DD'),
    actualComplete: null,
    urgent: true,
    partsReady: 8,
    partsTotal: 8,
    priceChanged: false,
    priceChangeDiff: 0,
    hasBlueScreenHistory: true,
    anomaly: {
      type: 'bsod_risk',
      level: 'danger',
      title: '主板批次关联蓝屏返修',
      description: '使用批次 ASUS-Z790A-06W2 主板，该批次近7天3起蓝屏返修。装机师必须进行4小时压力测试并记录',
      reportedAt: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
      operator: '客服小周',
      relatedRepairs: ['REP-20260610-003', 'REP-20260612-007', 'REP-20260613-011'],
      deadline: today.add(4, 'hour').format('YYYY-MM-DD HH:mm')
    },
    config: [
      { partId: 'CPU-002', name: 'AMD Ryzen 7 7800X3D', originalPrice: 3199, currentPrice: 3199, qty: 1, note: '' },
      { partId: 'MB-002', name: '微星 MAG B650 TOMOHAWK', originalPrice: 1899, currentPrice: 1899, qty: 1, note: '该批次需额外关注' },
      { partId: 'RAM-002', name: '金士顿 FURY Beast 32GB DDR5 6000', originalPrice: 699, currentPrice: 699, qty: 2, note: '共64GB' },
      { partId: 'SSD-001', name: '三星 990 Pro 2TB NVMe', originalPrice: 1499, currentPrice: 1499, qty: 2, note: '' },
      { partId: 'GPU-003', name: 'AMD RX 7900 XTX', originalPrice: 7999, currentPrice: 7999, qty: 1, note: '' },
      { partId: 'PSU-002', name: '海盗船 RM850x 金牌全模', originalPrice: 1099, currentPrice: 1099, qty: 1, note: '' },
      { partId: 'CASE-002', name: '追风者 P500A', originalPrice: 699, currentPrice: 699, qty: 1, note: '' },
      { partId: 'COOL-002', name: '恩杰 Kraken X73 RGB 360', originalPrice: 1099, currentPrice: 1099, qty: 1, note: '' }
    ],
    arrivalsRef: ['ARR-20260613-001', 'ARR-20260614-001'],
    history: [
      { time: twoDaysAgo.format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '创建订单', detail: '全款付清' },
      { time: twoDaysAgo.add(4, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '配件全部出库', detail: '8件配件齐套' },
      { time: yesterday.format('YYYY-MM-DD HH:mm'), operator: '陈工', action: '开始装机', detail: '主板+CPU+内存安装完成' },
      { time: today.subtract(3, 'hour').format('YYYY-MM-DD HH:mm'), operator: '系统', action: '批次风险预警', detail: '关联批次蓝屏返修x3，需4小时压力测试' },
      { time: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'), operator: '陈工', action: '开始压力测试', detail: '预计4小时后完成' }
    ]
  },
  {
    id: 'SO-20260615-003',
    customerName: '赵女士',
    customerPhone: '136****8899',
    usageType: '家用办公',
    totalAmount: 8597,
    paidAmount: 2000,
    remainingAmount: 6597,
    status: 'pending',
    technician: null,
    salesPerson: '小李',
    createdAt: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    expectedComplete: dayAfterTomorrow.format('YYYY-MM-DD'),
    actualComplete: null,
    urgent: false,
    partsReady: 0,
    partsTotal: 7,
    priceChanged: false,
    priceChangeDiff: 0,
    hasBlueScreenHistory: false,
    anomaly: null,
    config: [
      { partId: 'CPU-003', name: 'Intel i5-14600K', originalPrice: 2299, currentPrice: 2299, qty: 1, note: '' },
      { partId: 'MB-001', name: '华硕 ROG STRIX Z790-A', originalPrice: 2799, currentPrice: 2799, qty: 1, note: '' },
      { partId: 'RAM-002', name: '金士顿 FURY Beast 32GB DDR5 6000', originalPrice: 699, currentPrice: 699, qty: 1, note: '' },
      { partId: 'SSD-002', name: '西数 SN850X 1TB NVMe', originalPrice: 749, currentPrice: 749, qty: 1, note: '' },
      { partId: 'GPU-002', name: 'NVIDIA RTX 4060 Ti 8G', originalPrice: 3299, currentPrice: 3299, qty: 1, note: '' },
      { partId: 'PSU-001', name: '海韵 FOCUS GX-850W 金牌全模', originalPrice: 999, currentPrice: 999, qty: 1, note: '' },
      { partId: 'CASE-002', name: '追风者 P500A', originalPrice: 699, currentPrice: 699, qty: 1, note: '' }
    ],
    arrivalsRef: ['ARR-20260615-001'],
    history: [
      { time: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '创建订单', detail: '收定金 ¥2,000，等配件到货' }
    ]
  },
  {
    id: 'SO-20260614-008',
    customerName: '顺丰科技-采购部',
    customerPhone: '0755-8888****',
    usageType: '办公采购(批量3台)',
    totalAmount: 23991,
    paidAmount: 23991,
    remainingAmount: 0,
    status: 'completed',
    technician: '陈工',
    salesPerson: '张店长',
    createdAt: threeDaysAgo(today).format('YYYY-MM-DD HH:mm'),
    expectedComplete: yesterday.format('YYYY-MM-DD'),
    actualComplete: yesterday.add(6, 'hour').format('YYYY-MM-DD HH:mm'),
    urgent: false,
    partsReady: 21,
    partsTotal: 21,
    priceChanged: false,
    priceChangeDiff: 0,
    hasBlueScreenHistory: false,
    anomaly: null,
    config: [
      { partId: 'CPU-003', name: 'Intel i5-14600K', originalPrice: 2299, currentPrice: 2299, qty: 3, note: '批量3台' },
      { partId: 'MB-001', name: '华硕 ROG STRIX Z790-A', originalPrice: 2799, currentPrice: 2799, qty: 3, note: '' },
      { partId: 'RAM-002', name: '金士顿 FURY Beast 32GB DDR5 6000', originalPrice: 699, currentPrice: 699, qty: 3, note: '' },
      { partId: 'SSD-002', name: '西数 SN850X 1TB NVMe', originalPrice: 749, currentPrice: 749, qty: 3, note: '' },
      { partId: 'PSU-001', name: '海韵 FOCUS GX-850W 金牌全模', originalPrice: 999, currentPrice: 999, qty: 3, note: '' },
      { partId: 'CASE-002', name: '追风者 P500A', originalPrice: 699, currentPrice: 699, qty: 3, note: '' },
      { partId: 'COOL-001', name: '利民 Frozen MAGIC 360 ARGB', originalPrice: 399, currentPrice: 399, qty: 3, note: '' }
    ],
    arrivalsRef: ['ARR-20260613-001', 'ARR-20260614-001'],
    history: [
      { time: threeDaysAgo(today).format('YYYY-MM-DD HH:mm'), operator: '张店长', action: '创建企业订单', detail: '3台办公主机批量单' },
      { time: threeDaysAgo(today).add(5, 'hour').format('YYYY-MM-DD HH:mm'), operator: '王仓管', action: '批量出库', detail: '21件配件全部出库' },
      { time: twoDaysAgo.format('YYYY-MM-DD HH:mm'), operator: '陈工', action: '开始装机', detail: '3台并行装配' },
      { time: yesterday.add(3, 'hour').format('YYYY-MM-DD HH:mm'), operator: '陈工', action: '完成检测', detail: '3台均通过2小时压力测试' },
      { time: yesterday.add(6, 'hour').format('YYYY-MM-DD HH:mm'), operator: '小李(销售)', action: '交付完成', detail: '客户验收通过，已送货运走' }
    ]
  }
]

function threeDaysAgo (t) { return t.subtract(3, 'day') }
