import {
  LeadStatus,
  FollowupStatus,
  Role,
  ExceptionType,
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
} from '../types';

export interface TransitionRule {
  from: LeadStatus | null;
  to: LeadStatus;
  allowedRoles: Role[];
  requireFollowup: boolean;
  autoAssignTo?: Role;
  autoSetFollowupStatus?: FollowupStatus;
}

export const STATUS_TRANSITION_RULES: TransitionRule[] = [
  {
    from: null,
    to: 'new',
    allowedRoles: ['manager', 'supervisor'],
    requireFollowup: false,
  },
  {
    from: 'new',
    to: 'assigned',
    allowedRoles: ['manager'],
    requireFollowup: false,
    autoAssignTo: 'supervisor',
  },
  {
    from: 'new',
    to: 'returned',
    allowedRoles: ['manager'],
    requireFollowup: true,
    autoSetFollowupStatus: 'rejected',
  },
  {
    from: 'assigned',
    to: 'contacting',
    allowedRoles: ['supervisor'],
    requireFollowup: false,
    autoSetFollowupStatus: 'in_progress',
  },
  {
    from: 'assigned',
    to: 'returned',
    allowedRoles: ['supervisor', 'manager'],
    requireFollowup: true,
    autoSetFollowupStatus: 'rejected',
  },
  {
    from: 'contacting',
    to: 'needs_followup',
    allowedRoles: ['supervisor', 'property', 'engineering'],
    requireFollowup: true,
    autoSetFollowupStatus: 'scheduled',
  },
  {
    from: 'contacting',
    to: 'converted',
    allowedRoles: ['manager', 'supervisor'],
    requireFollowup: true,
    autoSetFollowupStatus: 'approved',
  },
  {
    from: 'contacting',
    to: 'lost',
    allowedRoles: ['manager', 'supervisor'],
    requireFollowup: true,
    autoSetFollowupStatus: 'completed',
  },
  {
    from: 'contacting',
    to: 'returned',
    allowedRoles: ['supervisor', 'manager'],
    requireFollowup: true,
    autoSetFollowupStatus: 'rejected',
  },
  {
    from: 'needs_followup',
    to: 'contacting',
    allowedRoles: ['supervisor', 'property', 'engineering'],
    requireFollowup: true,
    autoSetFollowupStatus: 'in_progress',
  },
  {
    from: 'needs_followup',
    to: 'converted',
    allowedRoles: ['manager', 'supervisor'],
    requireFollowup: true,
    autoSetFollowupStatus: 'approved',
  },
  {
    from: 'needs_followup',
    to: 'lost',
    allowedRoles: ['manager', 'supervisor'],
    requireFollowup: true,
    autoSetFollowupStatus: 'completed',
  },
  {
    from: 'needs_followup',
    to: 'returned',
    allowedRoles: ['supervisor', 'manager'],
    requireFollowup: true,
    autoSetFollowupStatus: 'rejected',
  },
  {
    from: 'returned',
    to: 'new',
    allowedRoles: ['manager'],
    requireFollowup: false,
  },
  {
    from: 'returned',
    to: 'contacting',
    allowedRoles: ['manager'],
    requireFollowup: false,
  },
];

export const RESPONSIBILITY_HANDOFF_MAP: Partial<Record<LeadStatus, Role[]>> = {
  assigned: ['supervisor'],
  contacting: ['supervisor', 'property', 'engineering'],
  needs_followup: ['supervisor', 'property', 'engineering'],
};

export function getAllowedTransitions(
  currentStatus: LeadStatus | null,
  userRole: Role
): LeadStatus[] {
  return STATUS_TRANSITION_RULES.filter(
    (rule) => rule.from === currentStatus && rule.allowedRoles.includes(userRole)
  ).map((rule) => rule.to);
}

export function canTransition(
  from: LeadStatus | null,
  to: LeadStatus,
  userRole: Role
): boolean {
  return STATUS_TRANSITION_RULES.some(
    (rule) =>
      rule.from === from && rule.to === to && rule.allowedRoles.includes(userRole)
  );
}

export function getTransitionRule(
  from: LeadStatus | null,
  to: LeadStatus
): TransitionRule | undefined {
  return STATUS_TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
}

export function detectGap(
  lead: Lead,
  lastTransition: StatusTransition | null,
  now: Date = new Date()
): { hasGap: boolean; gapDuration: number; exceptionType?: ExceptionType } {
  if (lead.status === 'new' && !lead.assignedTo) {
    const createdAt = new Date(lead.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation >= 24) {
      return {
        hasGap: true,
        gapDuration: hoursSinceCreation,
        exceptionType: 'unassigned_over_24h',
      };
    }
  }

  if (lead.status === 'needs_followup' && lastTransition) {
    const transitionedAt = new Date(lastTransition.transitionedAt);
    const hoursSinceTransition =
      (now.getTime() - transitionedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceTransition >= 48) {
      return {
        hasGap: true,
        gapDuration: hoursSinceTransition,
        exceptionType: 'no_followup_over_48h',
      };
    }
  }

  if (lastTransition) {
    const terminalStatuses: LeadStatus[] = ['converted', 'lost', 'returned'];
    if (!lastTransition.toResponsible && !terminalStatuses.includes(lastTransition.toStatus)) {
      const transitionedAt = new Date(lastTransition.transitionedAt);
      const minutesSinceTransition =
        (now.getTime() - transitionedAt.getTime()) / (1000 * 60);
      if (minutesSinceTransition >= 30) {
        return {
          hasGap: true,
          gapDuration: minutesSinceTransition / 60,
          exceptionType: 'status_gap_detected',
        };
      }
    }
  }

  return { hasGap: false, gapDuration: 0 };
}

export function validateTransition(
  lead: Lead,
  toStatus: LeadStatus,
  userRole: Role,
  followup: FollowupRecord | null,
  nextResponsible: string | null,
  nextResponsibleRole: Role | null
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoAssignRole?: Role;
  autoSetFollowupStatus?: FollowupStatus;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rule = getTransitionRule(lead.status, toStatus);

  if (!rule) {
    errors.push(`不允许从 ${lead.status} 流转到 ${toStatus}`);
    return { valid: false, errors, warnings };
  }

  if (!rule.allowedRoles.includes(userRole)) {
    errors.push(`当前角色无权执行此状态流转`);
    return { valid: false, errors, warnings };
  }

  if (rule.requireFollowup && !followup) {
    errors.push(`此状态流转需要关联跟进记录`);
    return { valid: false, errors, warnings };
  }

  const handoffRoles = RESPONSIBILITY_HANDOFF_MAP[toStatus];
  if (handoffRoles && handoffRoles.length > 0) {
    if (!nextResponsible && !rule.autoAssignTo) {
      errors.push(`流转到 ${toStatus} 必须指定下一责任人`);
    } else if (
      nextResponsibleRole &&
      rule.autoAssignTo &&
      nextResponsibleRole !== rule.autoAssignTo
    ) {
      errors.push(
        `此流转的责任人角色必须为 ${rule.autoAssignTo}`
      );
    }
  }

  if (toStatus === 'needs_followup' && followup) {
    if (!followup.nextActionAt) {
      warnings.push('建议设置下次跟进时间');
    }
    if (!followup.nextAction) {
      warnings.push('建议填写下次跟进计划');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    autoAssignRole: rule.autoAssignTo,
    autoSetFollowupStatus: rule.autoSetFollowupStatus,
  };
}

export function checkFollowupOverdue(
  followup: FollowupRecord,
  now: Date = new Date()
): { overdue: boolean; overdueHours: number; exceptionType?: ExceptionType } {
  if (!followup.scheduledAt || followup.status === 'completed') {
    return { overdue: false, overdueHours: 0 };
  }

  const scheduledAt = new Date(followup.scheduledAt);
  if (now > scheduledAt) {
    const overdueHours = (now.getTime() - scheduledAt.getTime()) / (1000 * 60 * 60);
    if (overdueHours >= 1) {
      return {
        overdue: true,
        overdueHours,
        exceptionType: 'followup_overdue',
      };
    }
  }

  return { overdue: false, overdueHours: 0 };
}
