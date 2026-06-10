import type { FeedRecord, ConsumptionAnalysis, TodoItem, ActivityItem, FarmRecord, ManagerReview } from '../types'
import dayjs from 'dayjs'

const today = dayjs().format('YYYY-MM-DD')
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

const FEED_RECORDS: FeedRecord[] = [
  {
    id: 'FR-20260610-001',
    houseId: 'H1',
    houseName: '1号舍',
    date: today,
    feedType: '产蛋期料',
    plannedAmount: 500,
    actualAmount: 480,
    feedTime: '06:30',
    feeder: '王建国',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: '鸡群采食积极性正常，料槽余料约3%',
    attachments: [
      { id: 'ATT-001', name: '投喂现场.jpg', size: '2.1MB', placeholder: true },
      { id: 'ATT-002', name: '料槽余料.jpg', size: '1.8MB', placeholder: true }
    ],
    createdAt: `${today} 06:32`,
    updatedAt: `${today} 06:32`
  },
  {
    id: 'FR-20260610-002',
    houseId: 'H2',
    houseName: '2号舍',
    date: today,
    feedType: '产蛋期料',
    plannedAmount: 480,
    actualAmount: null,
    feedTime: null,
    feeder: '王建国',
    status: 'pending',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${today} 00:00`,
    updatedAt: `${today} 00:00`
  },
  {
    id: 'FR-20260610-003',
    houseId: 'H3',
    houseName: '3号舍',
    date: today,
    feedType: '产蛋期料',
    plannedAmount: 520,
    actualAmount: 520,
    feedTime: '06:45',
    feeder: '李大明',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: '蛋壳质量明显下降，碎蛋率上升，疑似钙磷比失调，加料需场长确认',
    attachments: [
      { id: 'ATT-003', name: '碎蛋样本.jpg', size: '3.2MB', placeholder: true }
    ],
    createdAt: `${today} 06:48`,
    updatedAt: `${today} 07:10`
  },
  {
    id: 'FR-20260609-004',
    houseId: 'H4',
    houseName: '4号舍',
    date: yesterday,
    feedType: '产蛋期料',
    plannedAmount: 450,
    actualAmount: 450,
    feedTime: '06:20',
    feeder: '李大明',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${yesterday} 06:22`,
    updatedAt: `${yesterday} 06:22`
  },
  {
    id: 'FR-20260610-005',
    houseId: 'H5',
    houseName: '5号舍',
    date: today,
    feedType: '育成期料',
    plannedAmount: 300,
    actualAmount: 310,
    feedTime: '07:00',
    feeder: '赵小明',
    status: 'delivered',
    riskFlag: true,
    riskReason: '投喂量与计划偏差超3%，加料10kg未走审批',
    keyJudgment: '鸡群体重偏轻，7日均值低于标准120g，建议适当加料',
    attachments: [],
    createdAt: `${today} 07:02`,
    updatedAt: `${today} 07:15`
  },
  {
    id: 'FR-20260610-006',
    houseId: 'H6',
    houseName: '6号舍',
    date: today,
    feedType: '产蛋期料',
    plannedAmount: 500,
    actualAmount: null,
    feedTime: null,
    feeder: '赵小明',
    status: 'pending',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${today} 00:00`,
    updatedAt: `${today} 00:00`
  },
  {
    id: 'FR-20260609-007',
    houseId: 'H1',
    houseName: '1号舍',
    date: yesterday,
    feedType: '产蛋期料',
    plannedAmount: 500,
    actualAmount: 495,
    feedTime: '06:35',
    feeder: '王建国',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${yesterday} 06:37`,
    updatedAt: `${yesterday} 06:37`
  },
  {
    id: 'FR-20260609-008',
    houseId: 'H2',
    houseName: '2号舍',
    date: yesterday,
    feedType: '产蛋期料',
    plannedAmount: 480,
    actualAmount: 475,
    feedTime: '06:40',
    feeder: '王建国',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: '换料过渡第2天，采食量偏低属预期范围',
    attachments: [],
    createdAt: `${yesterday} 06:42`,
    updatedAt: `${yesterday} 06:42`
  },
  {
    id: 'FR-20260609-009',
    houseId: 'H3',
    houseName: '3号舍',
    date: yesterday,
    feedType: '产蛋期料',
    plannedAmount: 520,
    actualAmount: 510,
    feedTime: '06:50',
    feeder: '李大明',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${yesterday} 06:52`,
    updatedAt: `${yesterday} 06:52`
  },
  {
    id: 'FR-20260610-010',
    houseId: 'H4',
    houseName: '4号舍',
    date: today,
    feedType: '预混料',
    plannedAmount: 50,
    actualAmount: null,
    feedTime: null,
    feeder: '李大明',
    status: 'pending',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${today} 00:00`,
    updatedAt: `${today} 00:00`
  },
  {
    id: 'FR-20260609-011',
    houseId: 'H5',
    houseName: '5号舍',
    date: yesterday,
    feedType: '育成期料',
    plannedAmount: 300,
    actualAmount: 300,
    feedTime: '07:05',
    feeder: '赵小明',
    status: 'delivered',
    riskFlag: false,
    riskReason: null,
    keyJudgment: null,
    attachments: [],
    createdAt: `${yesterday} 07:07`,
    updatedAt: `${yesterday} 07:07`
  },
  {
    id: 'FR-20260609-012',
    houseId: 'H6',
    houseName: '6号舍',
    date: yesterday,
    feedType: '产蛋期料',
    plannedAmount: 500,
    actualAmount: 490,
    feedTime: '06:55',
    feeder: '赵小明',
    status: 'abnormal',
    riskFlag: true,
    riskReason: '料塔余料告警，上次可能未清零，实际投喂量存疑',
    keyJudgment: '料塔传感器显示余料15kg，正常应接近0，上批次可能未清零',
    attachments: [
      { id: 'ATT-004', name: '料塔传感器截图.png', size: '0.5MB', placeholder: true }
    ],
    createdAt: `${yesterday} 06:57`,
    updatedAt: `${yesterday} 08:30`
  }
]

const ANALYSES: ConsumptionAnalysis[] = [
  {
    id: 'CA-001',
    feedRecordId: 'FR-20260610-001',
    expectedConsumption: 480,
    actualConsumption: 470,
    variance: -10,
    varianceRate: -2.1,
    analyzer: '张秀兰',
    returnReason: null,
    supplementaryNotes: null,
    status: 'done',
    analyzedAt: `${today} 15:30`
  },
  {
    id: 'CA-003',
    feedRecordId: 'FR-20260610-003',
    expectedConsumption: 520,
    actualConsumption: null,
    variance: null,
    varianceRate: null,
    analyzer: null,
    returnReason: null,
    supplementaryNotes: null,
    status: 'pending',
    analyzedAt: null
  },
  {
    id: 'CA-004',
    feedRecordId: 'FR-20260609-004',
    expectedConsumption: 440,
    actualConsumption: 420,
    variance: -20,
    varianceRate: -4.5,
    analyzer: '张秀兰',
    returnReason: '饲料结块，分拣时退回约20kg',
    supplementaryNotes: '料仓底部发现受潮结块，已安排清理和防潮措施，剩余饲料已抽样送检',
    status: 'issue',
    analyzedAt: `${yesterday} 16:00`
  },
  {
    id: 'CA-005',
    feedRecordId: 'FR-20260610-005',
    expectedConsumption: 300,
    actualConsumption: null,
    variance: null,
    varianceRate: null,
    analyzer: null,
    returnReason: null,
    supplementaryNotes: null,
    status: 'pending',
    analyzedAt: null
  },
  {
    id: 'CA-007',
    feedRecordId: 'FR-20260609-007',
    expectedConsumption: 495,
    actualConsumption: 490,
    variance: -5,
    varianceRate: -1.0,
    analyzer: '张秀兰',
    returnReason: null,
    supplementaryNotes: null,
    status: 'done',
    analyzedAt: `${yesterday} 15:20`
  },
  {
    id: 'CA-008',
    feedRecordId: 'FR-20260609-008',
    expectedConsumption: 475,
    actualConsumption: 460,
    variance: -15,
    varianceRate: -3.2,
    analyzer: '刘小红',
    returnReason: null,
    supplementaryNotes: '换料过渡期，采食量偏低属正常范围，明日继续观察',
    status: 'done',
    analyzedAt: `${yesterday} 15:45`
  },
  {
    id: 'CA-009',
    feedRecordId: 'FR-20260609-009',
    expectedConsumption: 510,
    actualConsumption: 490,
    variance: -20,
    varianceRate: -3.9,
    analyzer: '刘小红',
    returnReason: '水线故障导致下午采食减少',
    supplementaryNotes: '3号舍水线14:00-16:00故障，已修复，预计明日恢复',
    status: 'issue',
    analyzedAt: `${yesterday} 16:30`
  },
  {
    id: 'CA-011',
    feedRecordId: 'FR-20260609-011',
    expectedConsumption: 300,
    actualConsumption: 295,
    variance: -5,
    varianceRate: -1.7,
    analyzer: '张秀兰',
    returnReason: null,
    supplementaryNotes: null,
    status: 'done',
    analyzedAt: `${yesterday} 15:10`
  },
  {
    id: 'CA-012',
    feedRecordId: 'FR-20260609-012',
    expectedConsumption: 490,
    actualConsumption: null,
    variance: null,
    varianceRate: null,
    analyzer: null,
    returnReason: null,
    supplementaryNotes: null,
    status: 'pending',
    analyzedAt: null
  }
]

const TODOS: TodoItem[] = [
  {
    id: 'TD-001',
    role: 'feeder',
    title: '2号舍产蛋期料投喂',
    description: '今日计划480kg，尚未执行',
    relatedRecordId: 'FR-20260610-002',
    priority: 'high',
    done: false,
    createdAt: `${today} 06:00`
  },
  {
    id: 'TD-002',
    role: 'feeder',
    title: '6号舍产蛋期料投喂',
    description: '今日计划500kg，尚未执行',
    relatedRecordId: 'FR-20260610-006',
    priority: 'high',
    done: false,
    createdAt: `${today} 06:00`
  },
  {
    id: 'TD-003',
    role: 'feeder',
    title: '4号舍预混料投喂',
    description: '今日计划50kg，尚未执行',
    relatedRecordId: 'FR-20260610-010',
    priority: 'medium',
    done: false,
    createdAt: `${today} 06:00`
  },
  {
    id: 'TD-004',
    role: 'sorter',
    title: '3号舍今日耗用分析',
    description: '投喂量超计划8%，需重点核实实际耗用',
    relatedRecordId: 'FR-20260610-003',
    priority: 'high',
    done: false,
    createdAt: `${today} 07:12`
  },
  {
    id: 'TD-005',
    role: 'sorter',
    title: '5号舍今日耗用分析',
    description: '投喂偏差超3%，需结合鸡群体重数据判断',
    relatedRecordId: 'FR-20260610-005',
    priority: 'high',
    done: false,
    createdAt: `${today} 07:16`
  },
  {
    id: 'TD-006',
    role: 'sorter',
    title: '6号舍昨日耗用分析',
    description: '料塔余料异常，实际耗用存疑',
    relatedRecordId: 'FR-20260609-012',
    priority: 'high',
    done: false,
    createdAt: `${yesterday} 08:32`
  },
  {
    id: 'TD-007',
    role: 'manager',
    title: '3号舍投喂量超计划审批',
    description: '投喂520kg，超计划8%，饲养员标注钙磷比失调',
    relatedRecordId: 'FR-20260610-003',
    reviewType: 'feed_deviation',
    priority: 'high',
    done: true,
    createdAt: `${today} 07:10`
  },
  {
    id: 'TD-008',
    role: 'manager',
    title: '5号舍投喂偏差确认',
    description: '加料10kg未走审批流程，需确认是否追认',
    relatedRecordId: 'FR-20260610-005',
    reviewType: 'feed_deviation',
    priority: 'high',
    done: false,
    createdAt: `${today} 07:15`
  },
  {
    id: 'TD-009',
    role: 'manager',
    title: '6号舍料塔异常核实',
    description: '料塔传感器余料15kg，上批次可能未清零',
    relatedRecordId: 'FR-20260609-012',
    reviewType: 'feed_deviation',
    priority: 'medium',
    done: false,
    createdAt: `${yesterday} 08:30`
  },
  {
    id: 'TD-010',
    role: 'manager',
    title: '4号舍料仓受潮跟进',
    description: '昨日发现料仓底部受潮结块，需确认清理和防潮进度',
    relatedRecordId: 'FR-20260609-004',
    reviewType: 'consumption_issue',
    priority: 'medium',
    done: true,
    createdAt: `${yesterday} 16:05`
  },
  {
    id: 'TD-011',
    role: 'feeder',
    title: '3号舍投喂确认补签',
    description: '已投喂但需补录关键判断',
    relatedRecordId: 'FR-20260610-003',
    priority: 'low',
    done: false,
    createdAt: `${today} 07:08`
  }
]

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'ACT-001',
    action: '风险标记',
    detail: '3号舍投喂量超计划8%，已标记风险',
    operator: '系统',
    role: 'manager',
    timestamp: `${today} 07:10`
  },
  {
    id: 'ACT-002',
    action: '投喂完成',
    detail: '3号舍产蛋期料投喂520kg，饲养员记录：蛋壳质量下降',
    operator: '李大明',
    role: 'feeder',
    timestamp: `${today} 06:48`
  },
  {
    id: 'ACT-003',
    action: '风险标记',
    detail: '5号舍投喂偏差超3%，加料未走审批',
    operator: '系统',
    role: 'manager',
    timestamp: `${today} 07:15`
  },
  {
    id: 'ACT-004',
    action: '耗用异常',
    detail: '4号舍饲料结块退回20kg，已安排清理',
    operator: '张秀兰',
    role: 'sorter',
    timestamp: `${yesterday} 16:00`
  },
  {
    id: 'ACT-005',
    action: '耗用异常',
    detail: '3号舍水线故障致采食减少，差异3.9%',
    operator: '刘小红',
    role: 'sorter',
    timestamp: `${yesterday} 16:30`
  },
  {
    id: 'ACT-006',
    action: '投喂异常',
    detail: '6号舍料塔余料告警，实际投喂量存疑',
    operator: '系统',
    role: 'manager',
    timestamp: `${yesterday} 08:30`
  },
  {
    id: 'ACT-007',
    action: '投喂完成',
    detail: '5号舍育成期料投喂310kg（计划300kg）',
    operator: '赵小明',
    role: 'feeder',
    timestamp: `${today} 07:02`
  },
  {
    id: 'ACT-008',
    action: '耗用完成',
    detail: '1号舍今日耗用470kg，偏差-2.1%，正常范围',
    operator: '张秀兰',
    role: 'sorter',
    timestamp: `${today} 15:30`
  }
]

const REVIEWS: ManagerReview[] = [
  {
    id: 'MR-003-feed',
    feedRecordId: 'FR-20260610-003',
    reviewType: 'feed_deviation',
    decision: 'approved',
    decisionDetail: '钙磷比失调属饲养调整需要，同意加料，但后续需正式提交配方变更申请',
    followUpActions: '1. 营养师3日内提交新配方方案；2. 3号舍蛋壳质量连续监测7日',
    reviewer: '陈场长',
    reviewedAt: `${today} 08:30`,
    status: 'followup',
    attachments: []
  },
  {
    id: 'MR-009-feed',
    feedRecordId: 'FR-20260609-009',
    reviewType: 'feed_deviation',
    decision: 'approved',
    decisionDetail: '3号舍昨日投喂量510kg属正常范围，偏差在容许区间内',
    followUpActions: null,
    reviewer: '陈场长',
    reviewedAt: `${yesterday} 17:50`,
    status: 'approved',
    attachments: []
  },
  {
    id: 'MR-004-consumption',
    feedRecordId: 'FR-20260609-004',
    reviewType: 'consumption_issue',
    decision: 'approved',
    decisionDetail: '受潮结块情况属实，同意退回20kg并安排料仓检修',
    followUpActions: '1. 料仓底部已加铺防潮垫；2. 剩余饲料抽样已送检，3日内出结果；3. 仓库温湿度监控增加报警阈值',
    reviewer: '陈场长',
    reviewedAt: `${yesterday} 17:20`,
    status: 'followup',
    attachments: [
      { id: 'ATT-MR-001', name: '料仓检修记录.pdf', size: '0.3MB', placeholder: true }
    ]
  },
  {
    id: 'MR-009-consumption',
    feedRecordId: 'FR-20260609-009',
    reviewType: 'consumption_issue',
    decision: 'approved',
    decisionDetail: '水线故障已修复，耗用偏差属外部因素，同意记录',
    followUpActions: '1. 水线维修已完成并验收；2. 3号舍未来3日重点观察采食恢复情况',
    reviewer: '陈场长',
    reviewedAt: `${yesterday} 17:45`,
    status: 'approved',
    attachments: []
  }
]

export function getInitialData() {
  const feedRecords = JSON.parse(JSON.stringify(FEED_RECORDS)) as FeedRecord[]
  const analyses = JSON.parse(JSON.stringify(ANALYSES)) as ConsumptionAnalysis[]
  const todos = JSON.parse(JSON.stringify(TODOS)) as TodoItem[]
  const activities = JSON.parse(JSON.stringify(ACTIVITIES)) as ActivityItem[]
  const reviews = JSON.parse(JSON.stringify(REVIEWS)) as ManagerReview[]

  const farmRecords: FarmRecord[] = feedRecords.map(fr => {
    const analysis = analyses.find(a => a.feedRecordId === fr.id) || null
    const recReviews = reviews.filter(r => r.feedRecordId === fr.id)
    return { feed: fr, analysis, reviews: recReviews }
  })

  return { feedRecords, analyses, todos, activities, reviews, farmRecords }
}
