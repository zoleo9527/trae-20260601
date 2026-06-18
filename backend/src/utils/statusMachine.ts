export type ScheduleStatus = 'DRAFT' | 'PENDING_CONFIRM' | 'APPROVED' | 'PUBLISHED' | 'CHANGED' | 'REJECTED';
export type MaterialStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'READY' | 'IN_USE' | 'RETURNED';

export interface StatusTransition {
  id: string;
  entityType: 'SCHEDULE' | 'MATERIAL';
  entityId: string;
  fromStatus: string;
  toStatus: string;
  operator: string;
  operatorName: string;
  reason?: string;
  remarks?: string;
  createdAt: string;
}

export const ScheduleStatusMachine: Record<ScheduleStatus, {
  label: string;
  allowedTransitions: ScheduleStatus[];
}> = {
  DRAFT: {
    label: '草稿',
    allowedTransitions: ['PENDING_CONFIRM'],
  },
  PENDING_CONFIRM: {
    label: '待社教老师确认',
    allowedTransitions: ['APPROVED', 'REJECTED'],
  },
  APPROVED: {
    label: '待活动主管审核',
    allowedTransitions: ['PUBLISHED', 'REJECTED'],
  },
  PUBLISHED: {
    label: '已发布',
    allowedTransitions: ['CHANGED'],
  },
  CHANGED: {
    label: '已变更',
    allowedTransitions: ['PUBLISHED'],
  },
  REJECTED: {
    label: '已退回',
    allowedTransitions: ['PENDING_CONFIRM'],
  },
};

export const MaterialStatusMachine: Record<MaterialStatus, {
  label: string;
  allowedTransitions: MaterialStatus[];
}> = {
  NOT_STARTED: {
    label: '未开始',
    allowedTransitions: ['IN_PROGRESS'],
  },
  IN_PROGRESS: {
    label: '准备中',
    allowedTransitions: ['READY', 'BLOCKED'],
  },
  BLOCKED: {
    label: '受阻',
    allowedTransitions: ['IN_PROGRESS'],
  },
  READY: {
    label: '已就绪',
    allowedTransitions: ['IN_USE', 'RETURNED'],
  },
  IN_USE: {
    label: '使用中',
    allowedTransitions: ['RETURNED'],
  },
  RETURNED: {
    label: '已归还',
    allowedTransitions: [],
  },
};

export const actionToScheduleStatus = {
  CONFIRM: 'PENDING_CONFIRM',
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  PUBLISH: 'PUBLISHED',
  CANCEL: 'REJECTED',
} as const;

export const actionToMaterialStatus = {
  START_PREPARE: 'IN_PROGRESS',
  MARK_READY: 'READY',
  MARK_BLOCKED: 'BLOCKED',
  IN_USE: 'IN_USE',
  RETURN: 'RETURNED',
} as const;
