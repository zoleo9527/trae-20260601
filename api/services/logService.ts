import { getData, generateId } from '../data/store.js';
import type { OperationLog } from '../../shared/types.js';

interface LogOptions {
  operator: string;
  operatorRole: string;
  operatorRoleText: string;
  action: string;
  actionText: string;
  targetType: string;
  targetId: string;
  targetName: string;
  description: string;
  changes?: {
    field: string;
    fieldText: string;
    oldValue: string;
    newValue: string;
  }[];
}

export const addLog = (options: LogOptions): OperationLog => {
  const { operationLogs } = getData();

  const log: OperationLog = {
    id: generateId('log'),
    timestamp: new Date().toISOString(),
    ...options,
  };

  operationLogs.unshift(log);
  return log;
};

export const getLogs = (params?: {
  role?: string;
  action?: string;
  targetType?: string;
  limit?: number;
}): OperationLog[] => {
  const { operationLogs } = getData();
  let logs = [...operationLogs];

  if (params?.role && params.role !== 'all') {
    logs = logs.filter(log => log.operatorRole === params.role);
  }
  if (params?.action && params.action !== 'all') {
    logs = logs.filter(log => log.action === params.action);
  }
  if (params?.targetType && params.targetType !== 'all') {
    logs = logs.filter(log => log.targetType === params.targetType);
  }
  if (params?.limit) {
    logs = logs.slice(0, params.limit);
  }

  return logs;
};
