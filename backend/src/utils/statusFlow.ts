import { CaseStatus, UserRole } from '../types';

export const STATUS_TRANSITIONS: Record<CaseStatus, { next: CaseStatus[]; allowedRoles: UserRole[] }> = {
  pending_script: {
    next: ['scripting'],
    allowedRoles: ['director', 'business']
  },
  scripting: {
    next: ['pending_approval'],
    allowedRoles: ['director']
  },
  pending_approval: {
    next: ['shooting', 'scripting'],
    allowedRoles: ['business']
  },
  shooting: {
    next: ['pending_data', 'delayed'],
    allowedRoles: ['director', 'talent_agent']
  },
  pending_data: {
    next: ['data_submitted'],
    allowedRoles: ['talent_agent']
  },
  data_submitted: {
    next: ['pending_settlement', 'data_rejected'],
    allowedRoles: ['business']
  },
  data_rejected: {
    next: ['data_submitted'],
    allowedRoles: ['talent_agent']
  },
  pending_settlement: {
    next: ['settlement_pending_review'],
    allowedRoles: ['finance']
  },
  settlement_pending_review: {
    next: ['completed', 'settlement_rejected'],
    allowedRoles: ['business']
  },
  settlement_rejected: {
    next: ['settlement_pending_review'],
    allowedRoles: ['finance']
  },
  completed: {
    next: [],
    allowedRoles: []
  },
  delayed: {
    next: ['shooting', 'pending_data'],
    allowedRoles: ['director', 'talent_agent']
  }
};

export const STATUS_LABELS: Record<CaseStatus, string> = {
  pending_script: '待脚本撰写',
  scripting: '脚本撰写中',
  pending_approval: '脚本待审批',
  shooting: '拍摄执行中',
  pending_data: '待提交结案数据',
  data_submitted: '结案数据已提交',
  data_rejected: '结案数据被驳回',
  pending_settlement: '待费用结算',
  settlement_pending_review: '结算待复核',
  settlement_rejected: '结算被驳回',
  completed: '已完成',
  delayed: '已延期'
};

export const ROLE_LABELS: Record<UserRole, string> = {
  business: '商务',
  director: '编导',
  talent_agent: '达人经纪',
  finance: '财务'
};

export const canTransition = (
  currentStatus: CaseStatus,
  targetStatus: CaseStatus,
  userRole: UserRole
): boolean => {
  const transition = STATUS_TRANSITIONS[currentStatus];
  if (!transition) return false;
  if (!transition.next.includes(targetStatus)) return false;
  if (!transition.allowedRoles.includes(userRole)) return false;
  return true;
};

export const getHandlerForStatus = (status: CaseStatus): UserRole | null => {
  const statusHandlerMap: Record<CaseStatus, UserRole | null> = {
    pending_script: 'director',
    scripting: 'director',
    pending_approval: 'business',
    shooting: 'director',
    pending_data: 'talent_agent',
    data_submitted: 'business',
    data_rejected: 'talent_agent',
    pending_settlement: 'finance',
    settlement_pending_review: 'business',
    settlement_rejected: 'finance',
    completed: null,
    delayed: 'director'
  };
  return statusHandlerMap[status];
};
