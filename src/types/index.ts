export type Role = 'manager' | 'supervisor' | 'property' | 'engineering';

export const ROLE_LABELS: Record<Role, string> = {
  manager: '招商经理',
  supervisor: '招商主管',
  property: '物业',
  engineering: '工程',
};

export type LeadStatus =
  | 'new'
  | 'assigned'
  | 'contacting'
  | 'needs_followup'
  | 'converted'
  | 'lost'
  | 'returned'
  | 'exception';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: '新建线索',
  assigned: '已分配',
  contacting: '接洽中',
  needs_followup: '待跟进',
  converted: '已转化',
  lost: '已流失',
  returned: '已退回',
  exception: '异常',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'blue',
  assigned: 'cyan',
  contacting: 'geekblue',
  needs_followup: 'orange',
  converted: 'green',
  lost: 'gray',
  returned: 'red',
  exception: 'magenta',
};

export type FollowupStatus =
  | 'pending'
  | 'in_progress'
  | 'scheduled'
  | 'completed'
  | 'needs_approval'
  | 'approved'
  | 'rejected'
  | 'exception';

export const FOLLOWUP_STATUS_LABELS: Record<FollowupStatus, string> = {
  pending: '待处理',
  in_progress: '处理中',
  scheduled: '已排期',
  completed: '已完成',
  needs_approval: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  exception: '异常',
};

export type ExceptionType =
  | 'unassigned_over_24h'
  | 'no_followup_over_48h'
  | 'status_gap_detected'
  | 'responsibility_conflict'
  | 'followup_overdue'
  | 'manual_flag';

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  unassigned_over_24h: '线索超过24小时未分配',
  no_followup_over_48h: '超过48小时无跟进记录',
  status_gap_detected: '状态流转出现空档',
  responsibility_conflict: '责任归属冲突',
  followup_overdue: '跟进任务逾期',
  manual_flag: '人工标记异常',
};

export interface LeadSource {
  type: 'old_ledger' | 'site_record' | 'chat_screenshot' | 'other';
  reference: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  contactPhone: string;
  industry: string;
  requiredArea: number;
  budget: number;
  status: LeadStatus;
  source: LeadSource;
  assignedTo: string | null;
  assignedRole: Role | null;
  assignedAt: string | null;
  currentResponsible: string | null;
  currentResponsibleRole: Role | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  remark: string;
  hasException: boolean;
  exceptionType: ExceptionType | null;
  exceptionMessage: string | null;
  exceptionAt: string | null;
}

export interface FollowupRecord {
  id: string;
  leadId: string;
  type: 'call' | 'visit' | 'meeting' | 'email' | 'chat' | 'site' | 'other';
  content: string;
  location?: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: FollowupStatus;
  handledBy: string;
  handledRole: Role;
  nextAction: string;
  nextActionAt: string | null;
  nextResponsible: string | null;
  nextResponsibleRole: Role | null;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
}

export interface StatusTransition {
  id: string;
  leadId: string;
  followupId: string | null;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  fromFollowupStatus: FollowupStatus | null;
  toFollowupStatus: FollowupStatus | null;
  fromResponsible: string | null;
  toResponsible: string | null;
  fromResponsibleRole: Role | null;
  toResponsibleRole: Role | null;
  transitionedAt: string;
  transitionedBy: string;
  transitionedByRole: Role;
  remark: string;
  isGapDetected: boolean;
  gapDurationMinutes: number;
}

export interface ExceptionLog {
  id: string;
  leadId: string;
  followupId: string | null;
  type: ExceptionType;
  message: string;
  detectedAt: string;
  handled: boolean;
  handledAt: string | null;
  handledBy: string | null;
  handledRemark: string | null;
  triggeredByTransitionId: string | null;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}
