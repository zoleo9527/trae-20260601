import dayjs from 'dayjs'

const today = dayjs()

export const repairs = [
  {
    id: 'REP-20260610-003',
    orderId: 'SO-20260528-005',
    customerName: '周先生',
    phone: '135****1122',
    issue: '开机2小时后蓝屏，错误码 WHEA_UNCORRECTABLE_ERROR',
    mainPart: '华硕 ROG STRIX Z790-A',
    batchCode: 'ASUS-Z790A-06W2',
    status: 'resolved',
    resolution: '更换同型号主板（更换批次：ASUS-Z790A-06W3）',
    technician: '陈工',
    reportedAt: '2026-06-10 14:30',
    resolvedAt: '2026-06-12 10:20',
    responsible: {
      person: '供应商',
      detail: '批次质量问题',
      costBorne: '供应商承担换件 ¥2,650'
    },
    slaHours: 48,
    actualHours: 43
  },
  {
    id: 'REP-20260612-007',
    orderId: 'SO-20260601-011',
    customerName: '吴经理',
    phone: '137****4455',
    issue: '3D渲染时频繁蓝屏重启，温度正常',
    mainPart: '华硕 ROG STRIX Z790-A',
    batchCode: 'ASUS-Z790A-06W2',
    status: 'resolved',
    resolution: '升级BIOS后问题解决，疑似内存兼容性',
    technician: '陈工',
    reportedAt: '2026-06-12 09:15',
    resolvedAt: '2026-06-13 16:40',
    responsible: {
      person: '装机师',
      detail: '装机时未更新BIOS',
      costBorne: '店内承担人工成本 ¥300'
    },
    slaHours: 24,
    actualHours: 31
  },
  {
    id: 'REP-20260613-011',
    orderId: 'SO-20260605-008',
    customerName: '郑先生',
    phone: '139****7788',
    issue: '空载正常，游戏满载10分钟内蓝屏',
    mainPart: '华硕 ROG STRIX Z790-A',
    batchCode: 'ASUS-Z790A-06W2',
    status: 'processing',
    resolution: null,
    technician: '陈工',
    reportedAt: '2026-06-13 18:50',
    resolvedAt: null,
    responsible: null,
    slaHours: 24,
    actualHours: Math.floor((Date.now() - new Date('2026-06-13T18:50:00').getTime()) / 3600000),
    deadline: today.add(2, 'hour').format('YYYY-MM-DD HH:mm')
  }
]

export const allAnomalies = [
  {
    id: 'AN-001',
    type: 'price_change',
    level: 'warning',
    source: 'system',
    title: '配置变更漏算价 ¥3,200',
    description: 'SO-20260615-001 客户将显卡从 RTX 4060 Ti 升级至 RTX 4070 Ti，销售未更新报价单',
    relatedId: 'SO-20260615-001',
    relatedType: 'schedule',
    responsible: '小李(销售)',
    deadline: today.add(3, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'pending',
    createdAt: today.subtract(1, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'AN-002',
    type: 'bsod_risk',
    level: 'danger',
    source: 'service',
    title: '批次蓝屏返修风险 - ASUS-Z790A-06W2',
    description: 'SO-20260615-002 正在装机，使用了有3起蓝屏返修记录的主板批次，必须完成4小时压力测试',
    relatedId: 'SO-20260615-002',
    relatedType: 'schedule',
    responsible: '陈工(装机师)',
    deadline: today.add(4, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'processing',
    createdAt: today.subtract(2, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'AN-003',
    type: 'shortage',
    level: 'warning',
    source: 'warehouse',
    title: '配件到货短缺 - 利民水冷 x2',
    description: 'ARR-20260615-002 验收发现利民水冷少2件，供应商今日补发，待确认',
    relatedId: 'ARR-20260615-002',
    relatedType: 'arrival',
    responsible: '王仓管',
    deadline: today.add(6, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'processing',
    createdAt: today.subtract(4, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'AN-004',
    type: 'sla_breach',
    level: 'danger',
    source: 'system',
    title: '返修即将超时 - REP-20260613-011',
    description: '郑先生的蓝屏返修单，距离SLA截止还有2小时，请优先处理',
    relatedId: 'REP-20260613-011',
    relatedType: 'repair',
    responsible: '陈工(装机师) / 客服小周',
    deadline: today.add(2, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'pending',
    createdAt: today.subtract(30, 'minute').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'AN-005',
    type: 'batch_warning',
    level: 'warning',
    source: 'service',
    title: '批次存疑预警 - ASUS-Z790A-06W2',
    description: 'ARR-20260613-001 入库主板批次关联3起返修，后续使用该批次需提前做压力测试',
    relatedId: 'ARR-20260613-001',
    relatedType: 'arrival',
    responsible: '张店长',
    deadline: null,
    status: 'warning',
    createdAt: today.subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  }
]

export const allHistory = []
