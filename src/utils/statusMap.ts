import type { Status, Role } from '@/types'

export const statusMap: Record<Status, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  under_review: { label: '审核中', color: 'processing' },
  approved: { label: '已批准', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
  supplement: { label: '补材料', color: 'warning' },
  urgent: { label: '有人催', color: 'error' },
  completed: { label: '已完成', color: 'success' },
}

export const roleMap: Record<Role, { label: string; permissions: string[] }> = {
  manager: {
    label: '客户经理',
    permissions: ['view_application', 'submit_application', 'view_risk', 'view_collection'],
  },
  risk_control: {
    label: '风控审核',
    permissions: ['view_application', 'review_risk', 'suggest_quota', 'approve_loan'],
  },
  post_loan: {
    label: '贷后专员',
    permissions: ['view_application', 'view_collection', 'record_collection', 'view_quota'],
  },
}

export const actionMap: Record<string, string> = {
  '提交申请': '创建',
  '风控审核': '审核',
  '额度建议': '建议',
  '催收提醒': '催收',
  '批准贷款': '批准',
  '拒绝贷款': '拒绝',
  '补充材料': '补充',
}
