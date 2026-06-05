import type { UserRole, Complaint } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  reception: '场馆前台',
  coach: '教练',
  manager: '值班店长',
};

export function getHandlerDisplay(complaint: Complaint): string {
  const roleLabel = ROLE_LABELS[complaint.currentHandlerRole] || complaint.currentHandlerRole;
  const name = complaint.currentHandlerName || '待分配';
  return `${roleLabel} · ${name}`;
}

export function getHandlerName(complaint: Complaint): string {
  return complaint.currentHandlerName || '待分配';
}

export function getHandlerRoleLabel(complaint: Complaint): string {
  return ROLE_LABELS[complaint.currentHandlerRole] || complaint.currentHandlerRole;
}
