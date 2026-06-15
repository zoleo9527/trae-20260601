import { ExceptionRecord } from '@/types';

export class BusinessException extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
    this.details = details;
  }
}

export class InvalidStatusTransitionException extends BusinessException {
  constructor(
    entityType: string,
    fromStatus: string,
    toStatus: string,
    role: string
  ) {
    super(
      `无权执行此状态转换: ${entityType} 从 ${fromStatus} 到 ${toStatus}，当前角色: ${role}`,
      'INVALID_STATUS_TRANSITION',
      { entityType, fromStatus, toStatus, role }
    );
  }
}

export class EntityNotFoundException extends BusinessException {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} 不存在: ${entityId}`, 'ENTITY_NOT_FOUND', {
      entityType,
      entityId,
    });
  }
}

export class PermissionDeniedException extends BusinessException {
  constructor(action: string, role: string) {
    super(`无权执行操作: ${action}，当前角色: ${role}`, 'PERMISSION_DENIED', {
      action,
      role,
    });
  }
}

export function handleException(e: unknown): ExceptionRecord | null {
  if (e instanceof BusinessException) {
    return {
      id: `err-${Date.now()}`,
      scheduleId: (e.details?.scheduleId as string) || '',
      scheduleNo: (e.details?.scheduleNo as string) || '',
      type: 'other',
      description: e.message,
      status: 'pending',
      reportedBy: 'system',
      reportedAt: new Date().toISOString(),
    };
  }
  return null;
}
