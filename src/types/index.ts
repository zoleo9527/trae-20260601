export type BatchStatus = 'pending_feed' | 'in_production' | 'pending_qc' | 'completed' | 'abnormal'

export type SampleStatus = 'pending_sample' | 'testing' | 'qualified' | 'unqualified' | 'archived' | 'destroyed'

export type UserRole = 'formulator' | 'production_lead' | 'qc_inspector' | 'manager'

export interface ProductionBatch {
  id: string
  batchNo: string
  formulaId: string
  formulaName: string
  status: BatchStatus
  progress: number
  createdBy: string
  createdAt: string
  updatedAt: string
  lastModifiedBy: string
  plannedQty: number
  actualQty: number | null
  history: BatchHistoryEntry[]
}

export interface QualitySample {
  id: string
  sampleNo: string
  batchId: string
  batchNo: string
  status: SampleStatus
  indicators: Record<string, number>
  tester: string
  testedAt: string | null
  createdAt: string
  updatedAt: string
  lastModifiedBy: string
  history: SampleHistoryEntry[]
  retentionExpiry: string | null
}

export interface BatchHistoryEntry {
  id: string
  batchId: string
  fromStatus: BatchStatus | null
  toStatus: BatchStatus
  operator: string
  operatorRole: UserRole
  remark: string
  timestamp: string
}

export interface SampleHistoryEntry {
  id: string
  sampleId: string
  fromStatus: SampleStatus | null
  toStatus: SampleStatus
  operator: string
  operatorRole: UserRole
  remark: string
  timestamp: string
}

export interface Formula {
  id: string
  name: string
  code: string
  batchCount: number
  lastUsedAt: string
}

export interface FeedLog {
  id: string
  batchId: string
  material: string
  weight: number
  operator: string
  timestamp: string
}

export interface ActivityItem {
  id: string
  type: 'batch' | 'sample' | 'formula'
  action: string
  operator: string
  operatorRole: UserRole
  targetId: string
  targetName: string
  timestamp: string
  priority: 'urgent' | 'normal' | 'low'
}

export const BATCH_STATUS_MAP: Record<BatchStatus, { label: string; color: string; bg: string }> = {
  pending_feed: { label: '待投料', color: 'text-amber-700', bg: 'bg-amber-50' },
  in_production: { label: '生产中', color: 'text-blue-700', bg: 'bg-blue-50' },
  pending_qc: { label: '待质检', color: 'text-orange-700', bg: 'bg-orange-50' },
  completed: { label: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  abnormal: { label: '异常', color: 'text-red-700', bg: 'bg-red-50' },
}

export const SAMPLE_STATUS_MAP: Record<SampleStatus, { label: string; color: string; bg: string }> = {
  pending_sample: { label: '待取样', color: 'text-amber-700', bg: 'bg-amber-50' },
  testing: { label: '检测中', color: 'text-blue-700', bg: 'bg-blue-50' },
  qualified: { label: '合格', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  unqualified: { label: '不合格', color: 'text-red-700', bg: 'bg-red-50' },
  archived: { label: '留样中', color: 'text-purple-700', bg: 'bg-purple-50' },
  destroyed: { label: '已销毁', color: 'text-zinc-500', bg: 'bg-zinc-100' },
}

export const ROLE_MAP: Record<UserRole, { label: string; color: string; defaultOperator: string }> = {
  formulator: { label: '配方师', color: 'text-violet-600', defaultOperator: '张配方' },
  production_lead: { label: '生产班长', color: 'text-blue-600', defaultOperator: '王建国' },
  qc_inspector: { label: '质检员', color: 'text-orange-600', defaultOperator: '李质检' },
  manager: { label: '厂长', color: 'text-emerald-600', defaultOperator: '厂长' },
}

export const BATCH_STATUS_ORDER: BatchStatus[] = ['abnormal', 'pending_qc', 'pending_feed', 'in_production', 'completed']
