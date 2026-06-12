import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { OperationLog, User, UserRole } from '../types';

interface LogParams {
  entityType: OperationLog['entityType'];
  entityId: string;
  action: string;
  description: string;
  operator: User;
  oldStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
}

export const logOperation = (params: LogParams): void => {
  const log: OperationLog = {
    id: uuidv4(),
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    description: params.description,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.role as UserRole,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
    details: params.details,
    timestamp: new Date().toISOString(),
  };

  db.operationLogs.unshift(log);

  if (db.operationLogs.length > 10000) {
    db.operationLogs = db.operationLogs.slice(0, 10000);
  }
};

export const getEntityLogs = (entityType: OperationLog['entityType'], entityId: string): OperationLog[] => {
  return db.operationLogs.filter(
    (log) => log.entityType === entityType && log.entityId === entityId
  );
};
