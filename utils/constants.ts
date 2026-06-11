import type { User, LeaseStatus, LeaseRecord } from '~/types/lease'

export const USERS: Record<string, User> = {
  zhaowei: {
    id: 'zhaowei',
    name: '赵伟',
    role: 'manager',
    department: '招商部-招商经理'
  },
  sunli: {
    id: 'sunli',
    name: '孙丽',
    role: 'supervisor',
    department: '招商部-招商主管'
  },
  chenjie: {
    id: 'chenjie',
    name: '陈杰',
    role: 'supervisor',
    department: '招商部-招商主管'
  },
  wanggang: {
    id: 'wanggang',
    name: '王刚',
    role: 'property_engineer',
    department: '物业工程部'
  },
  zhangmin: {
    id: 'zhangmin',
    name: '张敏',
    role: 'property_engineer',
    department: '物业工程部'
  }
}

export const STATUS_OPTIONS: { value: LeaseStatus; label: string; color: string }[] = [
  { value: 'lead_created', label: '线索创建', color: 'gray' },
  { value: 'lead_following', label: '线索跟进中', color: 'blue' },
  { value: 'plan_pending', label: '租赁方案待审批', color: 'amber' },
  { value: 'plan_rejected', label: '租赁方案已退回', color: 'red' },
  { value: 'plan_approved', label: '租赁方案已通过', color: 'emerald' },
  { value: 'contract_pending', label: '合同审批中', color: 'amber' },
  { value: 'contract_rejected', label: '合同已退回', color: 'red' },
  { value: 'contract_approved', label: '合同已签', color: 'emerald' },
  { value: 'decoration_pending', label: '装修进场待审批', color: 'amber' },
  { value: 'decoration_approved', label: '装修进场许可', color: 'emerald' },
  { value: 'completed', label: '入驻完成', color: 'purple' }
]

export function getStatusMeta(status: LeaseStatus) {
  return STATUS_OPTIONS.find(s => s.value === status)!
}

export function getStatusLabel(status: LeaseStatus) {
  return getStatusMeta(status).label
}

export function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    manager: '招商经理',
    supervisor: '招商主管',
    property_engineer: '物业工程'
  }
  return map[role] || role
}

export type StageKey = 'plan' | 'contract' | 'decoration'
export interface StageBadge {
  label: string
  cls: string
}

const STAGE_PLAN: Partial<Record<LeaseStatus, StageBadge>> = {
  lead_created: { label: '未提交', cls: 'bg-gray-100 text-gray-600' },
  lead_following: { label: '未提交', cls: 'bg-gray-100 text-gray-600' },
  plan_pending: { label: '租赁方案待审批', cls: 'bg-amber-50 text-amber-700' },
  plan_rejected: { label: '租赁方案已退回', cls: 'bg-red-50 text-red-700' },
  plan_approved: { label: '已通过·待起草合同', cls: 'bg-sky-50 text-sky-700' },
  contract_pending: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' },
  contract_rejected: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' },
  contract_approved: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' },
  decoration_pending: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' },
  decoration_approved: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' },
  completed: { label: '已通过·已流转合同', cls: 'bg-emerald-50 text-emerald-700' }
}

const STAGE_CONTRACT: Partial<Record<LeaseStatus, StageBadge>> = {
  lead_created: { label: '待启动', cls: 'bg-gray-100 text-gray-500' },
  lead_following: { label: '待启动', cls: 'bg-gray-100 text-gray-500' },
  plan_pending: { label: '方案阶段', cls: 'bg-gray-100 text-gray-500' },
  plan_rejected: { label: '方案阶段', cls: 'bg-gray-100 text-gray-500' },
  plan_approved: { label: '待提交合同', cls: 'bg-sky-50 text-sky-700' },
  contract_pending: { label: '合同审批中', cls: 'bg-amber-50 text-amber-700' },
  contract_rejected: { label: '合同已退回', cls: 'bg-red-50 text-red-700' },
  contract_approved: { label: '合同已签', cls: 'bg-emerald-50 text-emerald-700' },
  decoration_pending: { label: '已签订·已流转装修审批', cls: 'bg-sky-50 text-sky-700' },
  decoration_approved: { label: '已签订', cls: 'bg-emerald-50 text-emerald-700' },
  completed: { label: '已签订', cls: 'bg-emerald-50 text-emerald-700' }
}

const STAGE_DECORATION: Partial<Record<LeaseStatus, StageBadge>> = {
  lead_created: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  lead_following: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  plan_pending: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  plan_rejected: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  plan_approved: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  contract_pending: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  contract_rejected: { label: '未启动', cls: 'bg-gray-100 text-gray-500' },
  contract_approved: { label: '待提交装修申请', cls: 'bg-sky-50 text-sky-700' },
  decoration_pending: { label: '装修进场待审批', cls: 'bg-amber-50 text-amber-700' },
  decoration_approved: { label: '装修进场许可', cls: 'bg-emerald-50 text-emerald-700' },
  completed: { label: '已入驻', cls: 'bg-purple-50 text-purple-700' }
}

export function getStageBadge(stage: StageKey, status: LeaseStatus): StageBadge {
  const map = stage === 'plan' ? STAGE_PLAN : stage === 'contract' ? STAGE_CONTRACT : STAGE_DECORATION
  return map[status] || { label: '待启动', cls: 'bg-gray-100 text-gray-500' }
}

export interface BatchActionMeta {
  action: 'approve' | 'submit' | 'resubmit'
  label: string
  needReason: boolean
}

export const BATCH_ADVANCE_MAP: Partial<Record<Role, Partial<Record<LeaseStatus, BatchActionMeta>>>> = {
  manager: {
    plan_pending: { action: 'approve', label: '通过租赁方案', needReason: false },
    contract_pending: { action: 'approve', label: '通过合同审批', needReason: false }
  },
  supervisor: {
    plan_approved: { action: 'submit', label: '批量提交合同', needReason: false },
    contract_rejected: { action: 'resubmit', label: '批量重提合同', needReason: false }
  },
  property_engineer: {
    decoration_pending: { action: 'approve', label: '通过装修审批', needReason: false }
  }
}

export function getBatchActionMeta(role: Role, status: LeaseStatus): BatchActionMeta | null {
  return BATCH_ADVANCE_MAP[role]?.[status] || null
}
