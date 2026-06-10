import type { ReplacementStatus, UserRole, OperationAction } from './index';

export const STATUS_LABEL: Record<ReplacementStatus, string> = {
  draft: '草稿',
  pending_confirm: '待确认',
  confirmed: '已确认',
  rejected: '已退回',
  resubmitted: '已重新提交',
  completed: '已完成',
  closed: '已关闭',
};

export const STATUS_CLASS: Record<ReplacementStatus, string> = {
  draft: 'status-default',
  pending_confirm: 'status-warning',
  confirmed: 'status-info',
  rejected: 'status-danger',
  resubmitted: 'status-warning',
  completed: 'status-success',
  closed: 'status-default',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  technician: '维保技师',
  customer_service: '客服人员',
  supervisor: '主管',
};

export const ACTION_LABEL: Record<OperationAction, string> = {
  create: '创建',
  submit: '提交',
  confirm: '确认',
  confirm_cost: '费用确认',
  cost_confirm: '费用确认',
  reject: '退回',
  resubmit: '重新提交',
  supplement: '补充',
  complete: '完成',
  close: '关闭',
  assign: '指派',
  transfer: '转派',
  comment: '评论',
  update: '更新',
  add_supplement_note: '添加备注',
};

export const ELEVATOR_STATUS_LABEL: Record<
  'normal' | 'fault' | 'maintenance' | 'inspection',
  string
> = {
  normal: '正常运行',
  fault: '故障',
  maintenance: '维保中',
  inspection: '年检中',
};

export const MAINTENANCE_TYPE_LABEL: Record<
  'monthly' | 'quarterly' | 'semiannual' | 'annual',
  string
> = {
  monthly: '月度维保',
  quarterly: '季度维保',
  semiannual: '半年度维保',
  annual: '年度维保',
};

export const MAINTENANCE_STATUS_LABEL: Record<
  'pending' | 'in_progress' | 'completed' | 'overdue',
  string
> = {
  pending: '待执行',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
};

export const FAULT_STATUS_LABEL: Record<
  'pending' | 'dispatched' | 'processing' | 'resolved' | 'closed',
  string
> = {
  pending: '待派单',
  dispatched: '已派单',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const INSPECTION_TYPE_LABEL: Record<
  'annual' | 'periodic' | 'special',
  string
> = {
  annual: '年度检验',
  periodic: '定期检验',
  special: '专项检验',
};

export const INSPECTION_RESULT_LABEL: Record<
  'passed' | 'failed' | 'conditional',
  string
> = {
  passed: '合格',
  failed: '不合格',
  conditional: '复检合格',
};

export const CUSTOMER_LEVEL_LABEL: Record<'A' | 'B' | 'C', string> = {
  A: '重点客户',
  B: '普通客户',
  C: '一般客户',
};
