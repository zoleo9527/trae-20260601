import type { PlanStatus, PhaseStatus, EvaluationStatus, StaffRole, TimelineType } from '@/types'

export const planStatusMap: Record<PlanStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: '#6b7280', bgColor: '#f3f4f6' },
  pending: { label: '待审核', color: '#f59e0b', bgColor: '#fef3c7' },
  in_progress: { label: '进行中', color: '#3b82f6', bgColor: '#dbeafe' },
  completed: { label: '已完成', color: '#10b981', bgColor: '#d1fae5' },
  suspended: { label: '已暂停', color: '#ef4444', bgColor: '#fee2e2' }
}

export const phaseStatusMap: Record<PhaseStatus, { label: string; color: string; bgColor: string }> = {
  not_started: { label: '未开始', color: '#6b7280', bgColor: '#f3f4f6' },
  in_progress: { label: '进行中', color: '#3b82f6', bgColor: '#dbeafe' },
  pending_review: { label: '待复核', color: '#f59e0b', bgColor: '#fef3c7' },
  approved: { label: '已通过', color: '#10b981', bgColor: '#d1fae5' },
  rejected: { label: '已驳回', color: '#ef4444', bgColor: '#fee2e2' },
  supplemented: { label: '已补录', color: '#8b5cf6', bgColor: '#ede9fe' }
}

export const evaluationStatusMap: Record<EvaluationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待评估', color: '#6b7280', bgColor: '#f3f4f6' },
  completed: { label: '已完成', color: '#10b981', bgColor: '#d1fae5' },
  delayed: { label: '拖延中', color: '#ef4444', bgColor: '#fee2e2' },
  rejected: { label: '已驳回', color: '#ef4444', bgColor: '#fee2e2' },
  pending_review: { label: '待复核', color: '#f59e0b', bgColor: '#fef3c7' }
}

export const staffRoleMap: Record<StaffRole, { label: string; color: string }> = {
  nursing_director: { label: '护理主管', color: '#3b82f6' },
  primary_nurse: { label: '责任护工', color: '#10b981' },
  social_worker: { label: '社工', color: '#8b5cf6' }
}

export const timelineTypeMap: Record<TimelineType, { label: string; icon: string; color: string }> = {
  create: { label: '创建', icon: '➕', color: '#3b82f6' },
  update: { label: '更新', icon: '✏️', color: '#6b7280' },
  evaluation: { label: '评估', icon: '📋', color: '#10b981' },
  status_change: { label: '状态变更', icon: '🔄', color: '#f59e0b' },
  exception: { label: '异常', icon: '⚠️', color: '#ef4444' },
  review: { label: '审核', icon: '✅', color: '#8b5cf6' }
}

export const exceptionTypeMap: Record<string, { label: string; color: string }> = {
  delay: { label: '拖延', color: '#ef4444' },
  reject: { label: '驳回', color: '#ef4444' },
  supplement: { label: '补录', color: '#8b5cf6' },
  suspend: { label: '暂停', color: '#f59e0b' }
}

export const exceptionStatusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#ef4444', bgColor: '#fee2e2' },
  processing: { label: '处理中', color: '#f59e0b', bgColor: '#fef3c7' },
  resolved: { label: '已解决', color: '#10b981', bgColor: '#d1fae5' }
}
