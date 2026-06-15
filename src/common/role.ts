export enum UserRole {
  CLERK = 'clerk',
  STORE_MANAGER = 'store_manager',
  PURCHASER = 'purchaser',
}

export const RoleLabels: Record<UserRole, string> = {
  [UserRole.CLERK]: '店员',
  [UserRole.STORE_MANAGER]: '店长',
  [UserRole.PURCHASER]: '采购',
};

export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.CLERK]: [
    'member:create',
    'member:read',
    'member:update',
    'baby:create',
    'baby:read',
    'baby:update',
    'reminder:read',
  ],
  [UserRole.STORE_MANAGER]: [
    'member:create',
    'member:read',
    'member:update',
    'member:approve',
    'member:reject',
    'baby:create',
    'baby:read',
    'baby:update',
    'reminder:read',
    'reminder:handle',
  ],
  [UserRole.PURCHASER]: [
    'member:read',
    'baby:read',
    'reminder:read',
    'reminder:configure',
    'product:manage',
  ],
};

export interface UserContext {
  id: string;
  name: string;
  role: UserRole;
  storeId?: string;
  permissions: string[];
}