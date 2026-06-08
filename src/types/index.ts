export type DamageCategory = '包装破损' | '货物湿损' | '货物丢失' | '货物变形' | '标签脱落' | '温控异常'

export type DamageSeverity = '轻微' | '一般' | '严重' | '特重大'

export type DamageStatus = '待处理' | '处理中' | '待认定' | '已认定' | '已关闭'

export type LiabilityParty = '发货方' | '承运方' | '货站方' | '收货方' | '第三方' | '待定'

export type TaskFlag = 'today' | 'overdue' | 'returned'

export interface EvidenceSource {
  id: string
  type: '台账记录' | '现场记录' | '沟通截图' | '监控记录' | '照片' | '运单信息'
  title: string
  content: string
  timestamp: string
  operator: string
}

export interface DamageRecord {
  id: string
  awb: string
  flightNo: string
  route: string
  category: DamageCategory
  severity: DamageSeverity
  status: DamageStatus
  flag?: TaskFlag
  description: string
  discoveryTime: string
  discoveryLocation: string
  reporter: string
  handler?: string
  evidenceChain: EvidenceSource[]
  abnormalNote?: string
  liabilityId?: string
  createdAt: string
  updatedAt: string
}

export interface LiabilityDetermination {
  id: string
  damageId: string
  awb: string
  flightNo: string
  category: DamageCategory
  severity: DamageSeverity
  responsibleParty: LiabilityParty
  responsibleDetail: string
  basis: string
  compensationAmount?: number
  evidenceIds: string[]
  determiner: string
  determinedAt?: string
  status: '待认定' | '认定中' | '已认定' | '已退回'
  returnReason?: string
  abnormalNote?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardItem {
  id: string
  awb: string
  flightNo: string
  category: DamageCategory
  severity: DamageSeverity
  flag: TaskFlag
  summary: string
  status: DamageStatus
  time: string
  isUrgent: boolean
}
