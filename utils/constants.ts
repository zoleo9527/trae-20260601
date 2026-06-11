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
