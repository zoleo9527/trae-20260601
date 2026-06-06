import { GroupTicketStatus, UserRole } from '../types';

export const STATUS_LABELS: Record<GroupTicketStatus, string> = {
  pending_scheduling: '待排片审核',
  scheduling_reviewing: '排片审核中',
  scheduling_approved: '排片已通过',
  scheduling_rejected: '排片已驳回',
  pending_verification: '待核销',
  verifying: '核销处理中',
  verification_pending_review: '核销待复核',
  verification_rejected: '核销已驳回',
  completed: '已完成',
  cancelled: '已取消',
};

export const STATUS_COLORS: Record<GroupTicketStatus, string> = {
  pending_scheduling: '#faad14',
  scheduling_reviewing: '#1890ff',
  scheduling_approved: '#52c41a',
  scheduling_rejected: '#ff4d4f',
  pending_verification: '#faad14',
  verifying: '#1890ff',
  verification_pending_review: '#faad14',
  verification_rejected: '#ff4d4f',
  completed: '#52c41a',
  cancelled: '#8c8c8c',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  scheduling_manager: '排片经理',
  ticket_supervisor: '票务主管',
  duty_manager: '值班经理',
};

export function getHandlerForStatus(status: GroupTicketStatus): UserRole {
  const handlerMap: Record<GroupTicketStatus, UserRole> = {
    pending_scheduling: 'scheduling_manager',
    scheduling_reviewing: 'scheduling_manager',
    scheduling_approved: 'ticket_supervisor',
    scheduling_rejected: 'scheduling_manager',
    pending_verification: 'ticket_supervisor',
    verifying: 'ticket_supervisor',
    verification_pending_review: 'duty_manager',
    verification_rejected: 'ticket_supervisor',
    completed: 'duty_manager',
    cancelled: 'scheduling_manager',
  };
  return handlerMap[status];
}

export function canTransition(
  from: GroupTicketStatus,
  to: GroupTicketStatus,
  role: UserRole
): boolean {
  const transitions: Record<GroupTicketStatus, Array<{ to: GroupTicketStatus; roles: UserRole[] }>> = {
    pending_scheduling: [
      { to: 'scheduling_reviewing', roles: ['scheduling_manager'] },
    ],
    scheduling_reviewing: [
      { to: 'scheduling_approved', roles: ['scheduling_manager'] },
      { to: 'scheduling_rejected', roles: ['scheduling_manager'] },
    ],
    scheduling_approved: [
      { to: 'pending_verification', roles: ['ticket_supervisor'] },
    ],
    scheduling_rejected: [
      { to: 'scheduling_reviewing', roles: ['scheduling_manager'] },
    ],
    pending_verification: [
      { to: 'verifying', roles: ['ticket_supervisor'] },
    ],
    verifying: [
      { to: 'verification_pending_review', roles: ['ticket_supervisor'] },
    ],
    verification_pending_review: [
      { to: 'completed', roles: ['duty_manager'] },
      { to: 'verification_rejected', roles: ['duty_manager'] },
    ],
    verification_rejected: [
      { to: 'verification_pending_review', roles: ['ticket_supervisor'] },
    ],
    completed: [],
    cancelled: [],
  };

  const allowed = transitions[from] || [];
  return allowed.some(t => t.to === to && t.roles.includes(role));
}
