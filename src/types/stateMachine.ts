import type {
  RecyclingOrderStatus,
  ValuationStatus,
  ConfirmationStatus,
  Role,
} from './models';

export const RECYCLING_ORDER_TRANSITIONS: Record<
  RecyclingOrderStatus,
  { allowedNext: RecyclingOrderStatus[]; allowedRoles: Role[] }
> = {
  DRAFT: {
    allowedNext: ['PENDING_VALUATION', 'CANCELLED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  PENDING_VALUATION: {
    allowedNext: ['VALUATED', 'CANCELLED'],
    allowedRoles: ['PROCESSOR', 'MANAGER'],
  },
  VALUATED: {
    allowedNext: ['PENDING_CONFIRMATION', 'CANCELLED', 'REJECTED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  PENDING_CONFIRMATION: {
    allowedNext: ['CONFIRMED', 'OBJECTED', 'CANCELLED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  CONFIRMED: {
    allowedNext: ['COMPLETED', 'CANCELLED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  OBJECTED: {
    allowedNext: ['RE_VALUATED', 'CANCELLED', 'COMPLETED'],
    allowedRoles: ['PROCESSOR', 'MANAGER'],
  },
  RE_VALUATED: {
    allowedNext: ['PENDING_CONFIRMATION', 'CANCELLED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  COMPLETED: {
    allowedNext: [],
    allowedRoles: [],
  },
  REJECTED: {
    allowedNext: [],
    allowedRoles: [],
  },
  CANCELLED: {
    allowedNext: [],
    allowedRoles: [],
  },
};

export const VALUATION_TRANSITIONS: Record<
  ValuationStatus,
  { allowedNext: ValuationStatus[]; allowedRoles: Role[] }
> = {
  DRAFT: {
    allowedNext: ['SUBMITTED'],
    allowedRoles: ['PROCESSOR'],
  },
  SUBMITTED: {
    allowedNext: ['APPROVED', 'REJECTED'],
    allowedRoles: ['MANAGER'],
  },
  APPROVED: {
    allowedNext: [],
    allowedRoles: [],
  },
  REJECTED: {
    allowedNext: ['SUBMITTED'],
    allowedRoles: ['PROCESSOR'],
  },
};

export const CONFIRMATION_TRANSITIONS: Record<
  ConfirmationStatus,
  { allowedNext: ConfirmationStatus[]; allowedRoles: Role[] }
> = {
  PENDING: {
    allowedNext: ['CONFIRMED', 'OBJECTED', 'EXPIRED'],
    allowedRoles: ['RECEPTIONIST', 'MANAGER'],
  },
  CONFIRMED: {
    allowedNext: [],
    allowedRoles: [],
  },
  OBJECTED: {
    allowedNext: [],
    allowedRoles: [],
  },
  EXPIRED: {
    allowedNext: [],
    allowedRoles: [],
  },
};

export const canTransitionOrder = (
  currentStatus: RecyclingOrderStatus,
  nextStatus: RecyclingOrderStatus,
  role: Role
): boolean => {
  const transition = RECYCLING_ORDER_TRANSITIONS[currentStatus];
  return (
    transition.allowedNext.includes(nextStatus) &&
    transition.allowedRoles.includes(role)
  );
};

export const canTransitionValuation = (
  currentStatus: ValuationStatus,
  nextStatus: ValuationStatus,
  role: Role
): boolean => {
  const transition = VALUATION_TRANSITIONS[currentStatus];
  return (
    transition.allowedNext.includes(nextStatus) &&
    transition.allowedRoles.includes(role)
  );
};

export const canTransitionConfirmation = (
  currentStatus: ConfirmationStatus,
  nextStatus: ConfirmationStatus,
  role: Role
): boolean => {
  const transition = CONFIRMATION_TRANSITIONS[currentStatus];
  return (
    transition.allowedNext.includes(nextStatus) &&
    transition.allowedRoles.includes(role)
  );
};

export const STATUS_LABELS: Record<RecyclingOrderStatus, string> = {
  DRAFT: '待提交',
  PENDING_VALUATION: '待估价',
  VALUATED: '估价完成',
  PENDING_CONFIRMATION: '待客户确认',
  CONFIRMED: '客户已确认',
  OBJECTED: '客户有异议',
  RE_VALUATED: '重新估价完成',
  COMPLETED: '回收完成',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
};

export const URGENCY_LABELS: Record<string, string> = {
  NORMAL: '普通',
  URGENT: '紧急',
  EMERGENCY: '特急',
};

export const STATUS_COLORS: Record<RecyclingOrderStatus, string> = {
  DRAFT: '#9ca3af',
  PENDING_VALUATION: '#f59e0b',
  VALUATED: '#3b82f6',
  PENDING_CONFIRMATION: '#8b5cf6',
  CONFIRMED: '#10b981',
  OBJECTED: '#ef4444',
  RE_VALUATED: '#06b6d4',
  COMPLETED: '#059669',
  REJECTED: '#6b7280',
  CANCELLED: '#6b7280',
};
