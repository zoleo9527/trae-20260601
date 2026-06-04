import type { ComplicationStatus, ComplicationSeverity, FollowUpStatus, StaffRole, AuditAction } from '@/types'

export const statusMap: Record<ComplicationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#ef4444', bgColor: '#fee2e2' },
  processing: { label: '处理中', color: '#f59e0b', bgColor: '#fef3c7' },
  pending_followup: { label: '待回访', color: '#8b5cf6', bgColor: '#ede9fe' },
  resolved: { label: '已解决', color: '#10b981', bgColor: '#d1fae5' },
  closed: { label: '已结案', color: '#6b7280', bgColor: '#f3f4f6' },
  rejected: { label: '已驳回', color: '#dc2626', bgColor: '#fecaca' }
}

export const severityMap: Record<ComplicationSeverity, { label: string; color: string; bgColor: string }> = {
  mild: { label: '轻度', color: '#10b981', bgColor: '#d1fae5' },
  moderate: { label: '中度', color: '#f59e0b', bgColor: '#fef3c7' },
  severe: { label: '重度', color: '#f97316', bgColor: '#ffedd5' },
  critical: { label: '危重', color: '#ef4444', bgColor: '#fee2e2' }
}

export const followUpStatusMap: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待回访', color: '#f59e0b', bgColor: '#fef3c7' },
  completed: { label: '已完成', color: '#10b981', bgColor: '#d1fae5' },
  missed: { label: '已错过', color: '#ef4444', bgColor: '#fee2e2' },
  cancelled: { label: '已取消', color: '#6b7280', bgColor: '#f3f4f6' },
  returned: { label: '已退回', color: '#dc2626', bgColor: '#fecaca' }
}

export const followUpTypeMap: Record<string, { label: string; color: string }> = {
  phone: { label: '电话回访', color: '#3b82f6' },
  outpatient: { label: '门诊复查', color: '#10b981' },
  home: { label: '上门随访', color: '#8b5cf6' },
  inpatient: { label: '住院查房', color: '#f59e0b' }
}

export const staffRoleMap: Record<StaffRole, { label: string; color: string }> = {
  surgeon: { label: '主刀医生', color: '#3b82f6' },
  nurse: { label: '责任护士', color: '#10b981' },
  anesthesiologist: { label: '麻醉医师', color: '#8b5cf6' },
  department_head: { label: '科室主任', color: '#f59e0b' },
  admin: { label: '行政人员', color: '#6b7280' }
}

export const auditActionMap: Record<AuditAction, { label: string; icon: string; color: string }> = {
  report_create: { label: '创建上报', icon: '\u{1F4DD}', color: '#3b82f6' },
  report_update: { label: '更新上报', icon: '\u{270F}\u{FE0F}', color: '#6b7280' },
  status_change: { label: '状态变更', icon: '\u{1F504}', color: '#f59e0b' },
  followup_create: { label: '创建回访', icon: '\u{1F4DE}', color: '#8b5cf6' },
  followup_update: { label: '更新回访', icon: '\u{1F4CB}', color: '#10b981' },
  followup_complete: { label: '完成回访', icon: '\u{2705}', color: '#059669' },
  followup_return: { label: '退回回访', icon: '\u{21A9}\u{FE0F}', color: '#dc2626' },
  followup_cancel: { label: '取消回访', icon: '\u{1F6AB}', color: '#6b7280' },
  note_add: { label: '添加备注', icon: '\u{1F4AC}', color: '#6366f1' },
  attachment_upload: { label: '上传附件', icon: '\u{1F4CE}', color: '#06b6d4' },
  report_reject: { label: '驳回上报', icon: '\u{274C}', color: '#ef4444' },
  report_approve: { label: '通过上报', icon: '\u{2705}', color: '#10b981' }
}

export const errorCodeMap: Record<number, string> = {
  0: '操作成功',
  40001: '参数错误',
  40101: '未授权',
  40301: '无权限操作',
  40401: '记录不存在',
  40402: '并发症上报记录不存在',
  40403: '回访记录不存在',
  40404: '患者信息不存在',
  40405: '手术记录不存在',
  40901: '无效的状态流转',
  40902: '该上报已处理，无法重复操作',
  40903: '该回访已完成，无法修改',
  40904: '该回访已退回，需重新处理',
  40905: '只有已完成的回访才能退回',
  50001: '服务器内部错误',
  50002: '数据库操作失败'
}
