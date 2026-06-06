import type { UserRole, PreparationOrderStatus, InventoryLockStatus } from "@/types";

export const PERMISSIONS = {
  preparation: {
    create: ['operator', 'admin'] as UserRole[],
    editDraft: ['operator', 'admin'] as UserRole[],
    submitAudit: ['operator', 'admin'] as UserRole[],
    audit: ['customs', 'admin'] as UserRole[],
    supplement: ['operator', 'customs', 'admin'] as UserRole[],
    warehouseConfirm: ['warehouse', 'admin'] as UserRole[],
    lockInventory: ['warehouse', 'admin'] as UserRole[],
    ship: ['warehouse', 'admin'] as UserRole[],
    receive: ['warehouse', 'admin'] as UserRole[],
    cancel: ['operator', 'admin'] as UserRole[],
    view: ['operator', 'customs', 'warehouse', 'admin'] as UserRole[],
    export: ['operator', 'admin'] as UserRole[],
  },
  inventoryLock: {
    create: ['warehouse', 'admin'] as UserRole[],
    release: ['warehouse', 'admin'] as UserRole[],
    view: ['operator', 'customs', 'warehouse', 'admin'] as UserRole[],
  },
  customs: {
    upload: ['operator', 'customs', 'admin'] as UserRole[],
    audit: ['customs', 'admin'] as UserRole[],
    view: ['operator', 'customs', 'warehouse', 'admin'] as UserRole[],
  },
  return: {
    create: ['warehouse', 'admin'] as UserRole[],
    view: ['operator', 'customs', 'warehouse', 'admin'] as UserRole[],
  },
};

export function hasPermission(module: keyof typeof PERMISSIONS, action: string, role: UserRole): boolean {
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowedRoles = (modulePerms as Record<string, UserRole[]>)[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export const PREPARATION_STATUS_TRANSITIONS: Record<
  PreparationOrderStatus,
  Array<{ to: PreparationOrderStatus; action: string; roles: UserRole[] }>
> = {
  DRAFT: [
    { to: 'PENDING_AUDIT', action: '提交审核', roles: ['operator', 'admin'] },
  ],
  PENDING_AUDIT: [
    { to: 'AUDITING', action: '开始审核', roles: ['customs', 'admin'] },
    { to: 'CANCELLED', action: '取消', roles: ['operator', 'admin'] },
  ],
  AUDITING: [
    { to: 'PENDING_SUPPLEMENT', action: '退回补件', roles: ['customs', 'admin'] },
    { to: 'AUDIT_PASS', action: '审核通过', roles: ['customs', 'admin'] },
  ],
  PENDING_SUPPLEMENT: [
    { to: 'AUDITING', action: '重新提交', roles: ['operator', 'customs', 'admin'] },
    { to: 'CANCELLED', action: '取消', roles: ['operator', 'admin'] },
  ],
  AUDIT_PASS: [
    { to: 'WAREHOUSE_CONFIRM', action: '仓配确认', roles: ['warehouse', 'admin'] },
    { to: 'CANCELLED', action: '取消', roles: ['operator', 'admin'] },
  ],
  WAREHOUSE_CONFIRM: [
    { to: 'INVENTORY_LOCKED', action: '锁定库存', roles: ['warehouse', 'admin'] },
  ],
  INVENTORY_LOCKED: [
    { to: 'SHIPPED', action: '发运出库', roles: ['warehouse', 'admin'] },
  ],
  SHIPPED: [
    { to: 'RECEIVED', action: '海外仓入库', roles: ['warehouse', 'admin'] },
  ],
  RECEIVED: [
    { to: 'COMPLETED', action: '完成', roles: ['warehouse', 'admin'] },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function getAvailableActions(
  currentStatus: PreparationOrderStatus,
  role: UserRole
): Array<{ to: PreparationOrderStatus; action: string }> {
  const transitions = PREPARATION_STATUS_TRANSITIONS[currentStatus] || [];
  return transitions
    .filter(t => t.roles.includes(role))
    .map(({ to, action }) => ({ to, action }));
}

export const INVENTORY_LOCK_TRANSITIONS: Record<
  InventoryLockStatus,
  Array<{ to: InventoryLockStatus; action: string; roles: UserRole[] }>
> = {
  PENDING: [
    { to: 'LOCKED', action: '确认锁定', roles: ['warehouse', 'admin'] },
  ],
  LOCKED: [
    { to: 'RELEASED', action: '释放锁定', roles: ['warehouse', 'admin'] },
  ],
  RELEASED: [],
  EXPIRED: [],
};

export function getLockAvailableActions(
  currentStatus: InventoryLockStatus,
  role: UserRole
): Array<{ to: InventoryLockStatus; action: string }> {
  const transitions = INVENTORY_LOCK_TRANSITIONS[currentStatus] || [];
  return transitions
    .filter(t => t.roles.includes(role))
    .map(({ to, action }) => ({ to, action }));
}
