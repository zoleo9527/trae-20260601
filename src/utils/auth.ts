import type { UserRole } from '@/types';

const rolePermissions: Record<UserRole, string[]> = {
  project_manager: ['confirmation_view', 'confirmation_edit', 'collection_view', 'collection_edit', 'history_view'],
  reviewer: ['confirmation_view', 'confirmation_audit', 'collection_view', 'history_view'],
  finance: ['confirmation_view', 'collection_view', 'collection_edit', 'payment_confirm', 'history_view'],
  admin: ['confirmation_view', 'confirmation_edit', 'confirmation_audit', 'collection_view', 'collection_edit', 'payment_confirm', 'history_view', 'system_manage'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    project_manager: '项目经理',
    reviewer: '审核员',
    finance: '财务',
    admin: '管理员',
  };
  return roleNames[role] ?? role;
}