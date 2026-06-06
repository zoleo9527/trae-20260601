import type { Role, RolePermissions } from '@/types'

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  '/': ['frontline', 'manager', 'admin'],
  '/inventory': ['frontline', 'manager', 'admin'],
  '/screenings': ['frontline', 'manager', 'admin'],
  '/exceptions': ['frontline', 'manager', 'admin'],
  '/audit': ['manager', 'admin'],
  '/reports': ['manager', 'admin'],
  '/settings': ['admin'],
}

export const ACTION_PERMISSIONS: RolePermissions = {
  frontline: [
    { resource: 'inventory', actions: ['read', 'add_remark', 'add_attachment', 'update_status:in_progress', 'link_screening'] },
    { resource: 'screening', actions: ['read', 'add_remark', 'add_attachment', 'redeem_group_ticket'] },
    { resource: 'exception', actions: ['read', 'add_remark', 'add_attachment', 'update_status:handling'] },
    { resource: 'todo', actions: ['read', 'complete'] },
    { resource: 'risk', actions: ['read'] },
    { resource: 'audit', actions: [] },
  ],
  manager: [
    { resource: 'inventory', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'update_status', 'link_screening', 'sync_to_screening'] },
    { resource: 'screening', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'change_hall', 'record_equipment_failure', 'process_refund', 'redeem_group_ticket', 'complete_reconciliation'] },
    { resource: 'exception', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'update_status'] },
    { resource: 'todo', actions: ['read', 'create', 'update', 'delete', 'complete', 'assign'] },
    { resource: 'risk', actions: ['read', 'create', 'update', 'resolve'] },
    { resource: 'audit', actions: ['read', 'export'] },
  ],
  admin: [
    { resource: 'inventory', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'update_status', 'link_screening', 'sync_to_screening'] },
    { resource: 'screening', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'change_hall', 'record_equipment_failure', 'process_refund', 'redeem_group_ticket', 'complete_reconciliation'] },
    { resource: 'exception', actions: ['read', 'create', 'update', 'delete', 'add_remark', 'add_attachment', 'update_status'] },
    { resource: 'todo', actions: ['read', 'create', 'update', 'delete', 'complete', 'assign'] },
    { resource: 'risk', actions: ['read', 'create', 'update', 'delete', 'resolve'] },
    { resource: 'audit', actions: ['read', 'export', 'delete'] },
    { resource: 'user', actions: ['read', 'create', 'update', 'delete', 'manage_roles'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
}

export function canAccessRoute(route: string, role: Role): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route] || ROUTE_PERMISSIONS[route + '/'] || []
  return allowedRoles.includes(role)
}

export function canPerformAction(resource: string, action: string, role: Role): boolean {
  const permissions = ACTION_PERMISSIONS[role]
  if (!permissions) return false

  const resourcePerm = permissions.find((p) => p.resource === resource)
  if (!resourcePerm) return false

  if (resourcePerm.actions.includes(action)) return true

  const prefixAction = action.split(':')[0]
  return resourcePerm.actions.some((a) => a.startsWith(prefixAction + ':'))
}

export function getResourceActions(resource: string, role: Role): string[] {
  const permissions = ACTION_PERMISSIONS[role]
  if (!permissions) return []
  const resourcePerm = permissions.find((p) => p.resource === resource)
  return resourcePerm?.actions || []
}
