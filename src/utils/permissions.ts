import type { UserRole, Permission } from '../types';

const rolePermissions: Record<UserRole, Permission> = {
  nurse_manager: {
    canCreateVisit: true,
    canApproveVisit: true,
    canCancelVisit: true,
    canViewAllVisits: true,
    canCreateCommunication: true,
    canAssignCommunication: true,
    canResolveCommunication: true,
    canViewAllCommunications: true,
    canViewElderInfo: true,
    canEditElderInfo: true,
  },
  primary_nurse: {
    canCreateVisit: true,
    canApproveVisit: false,
    canCancelVisit: false,
    canViewAllVisits: false,
    canCreateCommunication: true,
    canAssignCommunication: false,
    canResolveCommunication: true,
    canViewAllCommunications: false,
    canViewElderInfo: true,
    canEditElderInfo: false,
  },
  social_worker: {
    canCreateVisit: false,
    canApproveVisit: false,
    canCancelVisit: false,
    canViewAllVisits: false,
    canCreateCommunication: true,
    canAssignCommunication: false,
    canResolveCommunication: true,
    canViewAllCommunications: false,
    canViewElderInfo: true,
    canEditElderInfo: false,
  },
  family: {
    canCreateVisit: true,
    canApproveVisit: false,
    canCancelVisit: true,
    canViewAllVisits: false,
    canCreateCommunication: true,
    canAssignCommunication: false,
    canResolveCommunication: false,
    canViewAllCommunications: false,
    canViewElderInfo: true,
    canEditElderInfo: false,
  },
};

export function getPermissionsByRole(role: UserRole): Permission {
  return rolePermissions[role] || rolePermissions.family;
}

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return getPermissionsByRole(role)[permission];
}
