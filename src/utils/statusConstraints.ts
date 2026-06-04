import type { VisitStatus, CommunicationStatus } from '../types';

const VISIT_STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['checked_in', 'cancelled', 'pending_followup'],
  rejected: [],
  checked_in: ['completed', 'stuck'],
  completed: [],
  cancelled: [],
  pending_followup: ['completed', 'stuck'],
  stuck: ['completed', 'pending_followup'],
};

const COMMUNICATION_STATUS_TRANSITIONS: Record<CommunicationStatus, CommunicationStatus[]> = {
  pending: ['in_progress', 'escalated', 'completed', 'stuck'],
  in_progress: ['completed', 'escalated', 'stuck'],
  completed: [],
  stuck: ['in_progress', 'completed', 'escalated'],
  escalated: ['in_progress', 'completed', 'stuck'],
};

export function canTransitionVisitStatus(from: VisitStatus, to: VisitStatus): boolean {
  const allowed = VISIT_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function canTransitionCommunicationStatus(from: CommunicationStatus, to: CommunicationStatus): boolean {
  const allowed = COMMUNICATION_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getVisitStatusDisplayName(status: VisitStatus): string {
  const names: Record<VisitStatus, string> = {
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    checked_in: '已签到',
    completed: '已完成',
    cancelled: '已取消',
    pending_followup: '待跟进',
    stuck: '处理中(异常)',
  };
  return names[status] || status;
}

export function getCommunicationStatusDisplayName(status: CommunicationStatus): string {
  const names: Record<CommunicationStatus, string> = {
    pending: '待处理',
    in_progress: '处理中',
    completed: '已完成',
    stuck: '已卡住',
    escalated: '已升级',
  };
  return names[status] || status;
}

export function getNextAllowedVisitStatuses(status: VisitStatus): VisitStatus[] {
  return VISIT_STATUS_TRANSITIONS[status] || [];
}

export function getNextAllowedCommunicationStatuses(status: CommunicationStatus): CommunicationStatus[] {
  return COMMUNICATION_STATUS_TRANSITIONS[status] || [];
}

export function validateVisitTransition(
  from: VisitStatus,
  to: VisitStatus,
  userRole: string
): { valid: boolean; reason?: string } {
  if (!canTransitionVisitStatus(from, to)) {
    return {
      valid: false,
      reason: `状态不允许从「${getVisitStatusDisplayName(from)}」直接变更为「${getVisitStatusDisplayName(to)}」`,
    };
  }

  if (to === 'approved' && userRole !== 'nurse_manager') {
    return { valid: false, reason: '只有护理主管可以审批预约' };
  }

  if (to === 'rejected' && userRole !== 'nurse_manager') {
    return { valid: false, reason: '只有护理主管可以拒绝预约' };
  }

  if (to === 'checked_in' && !['nurse_manager', 'primary_nurse'].includes(userRole)) {
    return { valid: false, reason: '只有医护人员可以签到' };
  }

  if (to === 'completed' && !['nurse_manager', 'primary_nurse'].includes(userRole)) {
    return { valid: false, reason: '只有医护人员可以签出完成' };
  }

  return { valid: true };
}

export function validateCommunicationTransition(
  from: CommunicationStatus,
  to: CommunicationStatus,
  userRole: string,
  isAssignee: boolean,
  isCreator: boolean
): { valid: boolean; reason?: string } {
  if (!canTransitionCommunicationStatus(from, to)) {
    return {
      valid: false,
      reason: `状态不允许从「${getCommunicationStatusDisplayName(from)}」直接变更为「${getCommunicationStatusDisplayName(to)}」`,
    };
  }

  if (to === 'completed' && !['nurse_manager', 'social_worker'].includes(userRole) && !isAssignee && !isCreator) {
    return { valid: false, reason: '只有处理人或主管可以标记完成' };
  }

  if (to === 'escalated' && !['nurse_manager', 'social_worker'].includes(userRole) && !isAssignee) {
    return { valid: false, reason: '只有处理人或主管可以升级处理' };
  }

  return { valid: true };
}
