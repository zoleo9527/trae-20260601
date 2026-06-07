import {
  InventoryDifferenceStatus,
  LossAnalysisStatus,
  UserRole,
  InventoryDifference,
  LossRecord,
} from '@/types';

export const ALLOWED_DIFFERENCE_TRANSITIONS: Record<
  InventoryDifferenceStatus,
  InventoryDifferenceStatus[]
> = {
  pending: ['confirmed', 'closed'],
  confirmed: ['resolved', 'appealed', 'closed'],
  appealed: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

export const ALLOWED_LOSS_TRANSITIONS: Record<
  LossAnalysisStatus,
  LossAnalysisStatus[]
> = {
  recorded: ['analyzing', 'archived'],
  analyzing: ['concluded', 'archived'],
  concluded: ['archived'],
  archived: [],
};

export const ROLE_DIFFERENCE_ACTIONS: Record<
  UserRole,
  Partial<Record<InventoryDifferenceStatus, InventoryDifferenceStatus[]>>
> = {
  store_manager: {
    confirmed: ['appealed'],
    pending: [],
    appealed: [],
    resolved: [],
    closed: [],
  },
  supervisor: {
    pending: ['confirmed', 'closed'],
    confirmed: ['resolved', 'closed'],
    appealed: ['resolved', 'closed'],
    resolved: ['closed'],
    closed: [],
  },
  product_specialist: {
    pending: [],
    confirmed: [],
    appealed: [],
    resolved: [],
    closed: [],
  },
};

export const ROLE_LOSS_ACTIONS: Record<
  UserRole,
  Partial<Record<LossAnalysisStatus, LossAnalysisStatus[]>>
> = {
  store_manager: {
    recorded: [],
    analyzing: [],
    concluded: [],
    archived: [],
  },
  supervisor: {
    recorded: ['analyzing', 'archived'],
    analyzing: ['concluded', 'archived'],
    concluded: ['archived'],
    archived: [],
  },
  product_specialist: {
    recorded: ['analyzing', 'archived'],
    analyzing: ['concluded', 'archived'],
    concluded: ['archived'],
    archived: [],
  },
};

export const canTransitionDifference = (
  currentStatus: InventoryDifferenceStatus,
  targetStatus: InventoryDifferenceStatus,
  role: UserRole
): boolean => {
  const allowedByState = ALLOWED_DIFFERENCE_TRANSITIONS[currentStatus];
  if (!allowedByState.includes(targetStatus)) {
    return false;
  }
  const roleAllowed = ROLE_DIFFERENCE_ACTIONS[role][currentStatus];
  if (!roleAllowed || !roleAllowed.includes(targetStatus)) {
    return false;
  }
  return true;
};

export const canTransitionLoss = (
  currentStatus: LossAnalysisStatus,
  targetStatus: LossAnalysisStatus,
  role: UserRole
): boolean => {
  const allowedByState = ALLOWED_LOSS_TRANSITIONS[currentStatus];
  if (!allowedByState.includes(targetStatus)) {
    return false;
  }
  const roleAllowed = ROLE_LOSS_ACTIONS[role][currentStatus];
  if (!roleAllowed || !roleAllowed.includes(targetStatus)) {
    return false;
  }
  return true;
};

export const validateDifferenceLossLink = (
  difference: InventoryDifference,
  loss: LossRecord
): { valid: boolean; reason?: string } => {
  if (difference.storeId !== loss.storeId) {
    return { valid: false, reason: '盘点差异与损耗记录必须属于同一门店' };
  }
  if (difference.productId !== loss.productId) {
    return { valid: false, reason: '盘点差异与损耗记录必须是同一商品' };
  }
  if (difference.status === 'closed') {
    return { valid: false, reason: '已关闭的盘点差异不能关联损耗记录' };
  }
  if (loss.status === 'archived') {
    return { valid: false, reason: '已归档的损耗记录不能关联盘点差异' };
  }
  return { valid: true };
};
