export type Role = 'feeder' | 'sorter' | 'manager'

export const ROLE_LABELS: Record<Role, string> = {
  feeder: '饲养员',
  sorter: '分拣员',
  manager: '场长'
}

export type FeedStatus = 'pending' | 'delivered' | 'abnormal'
export type AnalysisStatus = 'pending' | 'done' | 'issue'

export const FEED_STATUS_LABELS: Record<FeedStatus, string> = {
  pending: '待投喂',
  delivered: '已投喂',
  abnormal: '异常'
}

export const ANALYSIS_STATUS_LABELS: Record<AnalysisStatus, string> = {
  pending: '待分析',
  done: '已完成',
  issue: '有异常'
}

export interface Attachment {
  id: string
  name: string
  size: string
  placeholder: boolean
}

export interface FeedRecord {
  id: string
  houseId: string
  houseName: string
  date: string
  feedType: string
  plannedAmount: number
  actualAmount: number | null
  feedTime: string | null
  feeder: string
  status: FeedStatus
  riskFlag: boolean
  riskReason: string | null
  keyJudgment: string | null
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface ConsumptionAnalysis {
  id: string
  feedRecordId: string
  expectedConsumption: number
  actualConsumption: number | null
  variance: number | null
  varianceRate: number | null
  analyzer: string | null
  returnReason: string | null
  supplementaryNotes: string | null
  status: AnalysisStatus
  analyzedAt: string | null
}

export interface TodoItem {
  id: string
  role: Role
  title: string
  description: string
  relatedRecordId: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
  createdAt: string
}

export interface ActivityItem {
  id: string
  action: string
  detail: string
  operator: string
  role: Role
  timestamp: string
}

export interface FarmRecord {
  feed: FeedRecord
  analysis: ConsumptionAnalysis | null
}
