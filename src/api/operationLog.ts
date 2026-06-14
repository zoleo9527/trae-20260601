import { RoleType, ActionType } from '../types';
import { operationLogs as initialLogs } from '../data/mockData';
import { OperationLog } from '../types';

let operationLogs: OperationLog[] = [...initialLogs];

export const logOperation = (
  operationType: string,
  targetType: 'batch' | 'notification' | 'exception',
  targetId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: RoleType,
  details: string
): OperationLog => {
  const log: OperationLog = {
    id: `log${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operationType,
    targetType,
    targetId,
    operatorId,
    operatorName,
    operatorRole,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    details,
  };
  operationLogs.unshift(log);
  return log;
};

export const getOperationLogs = (
  targetType?: 'batch' | 'notification' | 'exception',
  targetId?: string,
  operatorRole?: RoleType
): OperationLog[] => {
  let result = [...operationLogs];
  
  if (targetType) {
    result = result.filter(log => log.targetType === targetType);
  }
  
  if (targetId) {
    result = result.filter(log => log.targetId === targetId);
  }
  
  if (operatorRole) {
    result = result.filter(log => log.operatorRole === operatorRole);
  }
  
  return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

export const getOperationHistory = (targetType: 'batch' | 'notification' | 'exception', targetId: string): OperationLog[] => {
  return getOperationLogs(targetType, targetId);
};

export const validateActionPermission = (action: ActionType, role: RoleType): { allowed: boolean; errorCode?: string; message?: string } => {
  const actionPermissionMap: Record<ActionType, { roles: RoleType[]; errorCode: string; message: string }> = {
    'create_batch': { roles: ['registrar'], errorCode: 'USR002', message: '只有报名员可以创建考试批次' },
    'submit_batch': { roles: ['registrar'], errorCode: 'USR002', message: '只有报名员可以提交考试批次' },
    'confirm_batch': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以确认批次' },
    'cancel_batch': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以取消批次' },
    'complete_exam': { roles: ['safety_officer'], errorCode: 'USR002', message: '只有安全员可以完成考试' },
    'send_notification': { roles: ['trainer'], errorCode: 'USR002', message: '只有场地教练可以发送通知' },
    'confirm_notification': { roles: ['safety_officer'], errorCode: 'USR002', message: '只有安全员可以确认通知' },
    'mark_absent': { roles: ['trainer', 'safety_officer'], errorCode: 'USR002', message: '只有场地教练或安全员可以标记缺考' },
    'complete_notification': { roles: ['trainer'], errorCode: 'USR002', message: '只有场地教练可以完成通知' },
    'handle_exception': { roles: ['registrar', 'trainer', 'safety_officer'], errorCode: 'USR002', message: '您没有权限处理异常' },
  };

  const config = actionPermissionMap[action];
  if (!config) {
    return { allowed: false, errorCode: 'USR002', message: '未知的操作类型' };
  }

  const allowed = config.roles.includes(role);
  return {
    allowed,
    errorCode: allowed ? undefined : config.errorCode,
    message: allowed ? undefined : config.message,
  };
};
