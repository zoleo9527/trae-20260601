import { Appeal, AppealStatus, UserRole, AuditLog, AuditAction } from '../types';
import { STATUS_TRANSITIONS, ROLE_ALLOWED_STATUS, ERROR_CODES, SLA_DAYS } from '../types';

export const isStatusTransitionValid = (
  currentStatus: AppealStatus,
  newStatus: AppealStatus
): boolean => {
  return STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};

export const isRoleAllowedForStatus = (
  role: UserRole,
  status: AppealStatus
): boolean => {
  return ROLE_ALLOWED_STATUS[role].includes(status);
};

export const canUserHandleAppeal = (
  userRole: UserRole,
  appeal: Appeal
): boolean => {
  if (!isRoleAllowedForStatus(userRole, appeal.status)) {
    return false;
  }
  if (appeal.assignedTo && appeal.assignedTo !== getCurrentUserId()) {
    return false;
  }
  return true;
};

export const getCurrentUserId = (): string => {
  return 'u2';
};

export const getCurrentUserRole = (): UserRole => {
  return 'inspector';
};

export const calculateDaysRemaining = (deadline: string | undefined): number => {
  if (!deadline) return -1;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isOverdue = (deadline: string | undefined): boolean => {
  return calculateDaysRemaining(deadline) < 0;
};

export const isTodayCreated = (createdAt: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return createdAt.startsWith(today);
};

export const generateNextStatus = (
  currentStatus: AppealStatus,
  userRole: UserRole
): AppealStatus | null => {
  const transitions = STATUS_TRANSITIONS[currentStatus];
  
  if (userRole === 'receiver') {
    return transitions.includes('pending_inspection') ? 'pending_inspection' : null;
  }
  
  if (userRole === 'inspector') {
    if (transitions.includes('pending_finance')) return 'pending_finance';
    if (transitions.includes('pending_receipt')) return 'pending_receipt';
    return null;
  }
  
  if (userRole === 'finance') {
    if (transitions.includes('pending_confirmation')) return 'pending_confirmation';
    if (transitions.includes('resolved')) return 'resolved';
    if (transitions.includes('pending_inspection')) return 'pending_inspection';
    return null;
  }
  
  if (userRole === 'admin') {
    return transitions[0] || null;
  }
  
  return null;
};

export const createAuditLog = (
  appealId: string,
  action: AuditAction,
  actorId: string,
  actorName: string,
  actorRole: UserRole,
  details: Record<string, unknown>,
  previousStatus?: AppealStatus,
  newStatus?: AppealStatus
): AuditLog => {
  return {
    id: `log_${Date.now()}`,
    appealId,
    action,
    actorId,
    actorName,
    actorRole,
    timestamp: new Date().toISOString(),
    details,
    previousStatus,
    newStatus,
  };
};

export const handleAppeal = (
  appeal: Appeal,
  action: 'forward' | 'reject' | 'return' | 'resolve',
  comment?: string,
  resolutionAmount?: number
): { appeal: Appeal; auditLog: AuditLog } => {
  const userRole = getCurrentUserRole();
  const userId = getCurrentUserId();
  const actorName = getActorName(userId);
  
  let newStatus: AppealStatus = appeal.status;
  let previousStatus = appeal.status;
  
  switch (action) {
    case 'forward':
      const nextStatus = generateNextStatus(appeal.status, userRole);
      if (nextStatus && isStatusTransitionValid(appeal.status, nextStatus)) {
        newStatus = nextStatus;
      } else {
        throw new Error(ERROR_CODES.INVALID_STATUS_TRANSITION);
      }
      break;
      
    case 'reject':
      if (STATUS_TRANSITIONS[appeal.status].includes('rejected')) {
        newStatus = 'rejected';
      } else {
        throw new Error(ERROR_CODES.INVALID_STATUS_TRANSITION);
      }
      break;
      
    case 'return':
      if (STATUS_TRANSITIONS[appeal.status].includes('returned')) {
        newStatus = 'returned';
      } else {
        throw new Error(ERROR_CODES.INVALID_STATUS_TRANSITION);
      }
      break;
      
    case 'resolve':
      if (STATUS_TRANSITIONS[appeal.status].includes('resolved')) {
        newStatus = 'resolved';
      } else {
        throw new Error(ERROR_CODES.INVALID_STATUS_TRANSITION);
      }
      break;
  }
  
  const details: Record<string, unknown> = { comment };
  if (resolutionAmount !== undefined) {
    details.resolutionAmount = resolutionAmount;
  }
  
  const auditLog = createAuditLog(
    appeal.id,
    action as AuditAction,
    userId,
    actorName,
    userRole,
    details,
    previousStatus,
    newStatus
  );
  
  const updatedAppeal: Appeal = {
    ...appeal,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    auditLogIds: [...appeal.auditLogIds, auditLog.id],
    rejectionReason: action === 'reject' ? comment : appeal.rejectionReason,
    returnReason: action === 'return' ? comment : appeal.returnReason,
    resolutionAmount: action === 'resolve' ? resolutionAmount : appeal.resolutionAmount,
  };
  
  return { appeal: updatedAppeal, auditLog };
};

export const getActorName = (userId: string): string => {
  const userMap: Record<string, string> = {
    'u1': '王收货',
    'u2': '李检测',
    'u3': '张财务',
    'u4': '赵管理员',
  };
  return userMap[userId] || '未知用户';
};

export const formatDeadline = (deadline: string | undefined): string => {
  if (!deadline) return '-';
  const date = new Date(deadline);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: AppealStatus): string => {
  const colorMap: Record<AppealStatus, string> = {
    pending_receipt: 'orange',
    pending_inspection: 'blue',
    pending_finance: 'purple',
    pending_confirmation: 'cyan',
    resolved: 'green',
    rejected: 'red',
    returned: 'gray',
  };
  return colorMap[status];
};

export const getUrgencyLevel = (deadline: string | undefined): 'normal' | 'warning' | 'danger' => {
  const daysRemaining = calculateDaysRemaining(deadline);
  if (daysRemaining < 0) return 'danger';
  if (daysRemaining <= 1) return 'warning';
  return 'normal';
};

export const calculateSlaDeadline = (appeal: Appeal): string => {
  const createdAt = new Date(appeal.createdAt);
  const slaDays = SLA_DAYS[appeal.appealType];
  createdAt.setDate(createdAt.getDate() + slaDays);
  return createdAt.toISOString();
};