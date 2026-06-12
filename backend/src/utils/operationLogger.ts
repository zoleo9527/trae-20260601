import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { OperationLog, UserRole, TimelineEvent, Attachment } from '../types';
import { convertToCamelCase, convertFields } from './fieldConverter';

export const logOperation = async (
  entityType: OperationLog['entityType'],
  entityId: string,
  action: string,
  description: string,
  operatorId: string,
  operatorName: string,
  operatorRole: UserRole,
  oldStatus?: string,
  newStatus?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  const db = await getDb();
  const log: OperationLog = {
    id: uuidv4(),
    entityType,
    entityId,
    action,
    description,
    operatorId,
    operatorName,
    operatorRole,
    oldStatus,
    newStatus,
    details,
    timestamp: new Date().toISOString(),
  };

  await db.run(
    `INSERT INTO operation_logs (
      id, entity_type, entity_id, action, description,
      operator_id, operator_name, operator_role, old_status,
      new_status, details, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.entityType,
      log.entityId,
      log.action,
      log.description,
      log.operatorId,
      log.operatorName,
      log.operatorRole,
      log.oldStatus,
      log.newStatus,
      details ? JSON.stringify(details) : null,
      log.timestamp,
    ]
  );
};

export const getOperationLogs = async (
  entityType: OperationLog['entityType'],
  entityId: string
): Promise<OperationLog[]> => {
  const db = await getDb();
  const logs = await db.all(
    `SELECT * FROM operation_logs 
     WHERE entity_type = ? AND entity_id = ? 
     ORDER BY timestamp DESC`,
    [entityType, entityId]
  );

  return logs.map((log) => convertFields.operationLog(log));
};

export const generateTimeline = (
  logs: OperationLog[],
  exceptions: any[] = [],
  attachments: Attachment[] = []
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  logs.forEach((log) => {
    const type: TimelineEvent['type'] = log.oldStatus && log.newStatus ? 'status_change' : 'action';
    const entityLabel = log.entityType === 'arrangement' ? '【安排】' : log.entityType === 'signin' ? '【签到】' : '';
    events.push({
      id: log.id,
      time: log.timestamp,
      type,
      title: `${entityLabel}${log.action}`,
      content: log.description,
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      operatorRole: log.operatorRole,
      attachments: [],
      metadata: { ...log.details, entityType: log.entityType },
    });
  });

  exceptions.forEach((ex) => {
    events.push({
      id: ex.id,
      time: ex.triggeredAt || ex.triggered_at || ex.createdAt,
      type: 'exception',
      title: `【异常】[${ex.severity === 'critical' ? '严重' : ex.severity === 'high' ? '高' : ex.severity === 'medium' ? '中' : '低'}] ${ex.title}`,
      content: ex.description,
      operatorId: null,
      operatorName: null,
      operatorRole: null,
      attachments: ex.attachments || [],
      metadata: {
        exceptionType: ex.type,
        severity: ex.severity,
        status: ex.status,
        entityType: 'exception',
      },
    });
  });

  attachments.forEach((att) => {
    events.push({
      id: att.id,
      time: att.uploadedAt,
      type: 'attachment',
      title: `上传附件：${att.name}`,
      content: `附件类型：${att.category}，大小：${formatFileSize(att.size)}`,
      operatorId: att.uploadedBy,
      operatorName: att.uploadedByName,
      operatorRole: null,
      attachments: [att],
      metadata: {
        attachmentId: att.id,
        attachmentType: att.type,
        attachmentSize: att.size,
        attachmentUrl: att.url,
      },
    });
  });

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const parseAttachmentJson = (json: string | null): Attachment[] => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const serializeAttachmentJson = (attachments: Attachment[]): string => {
  return JSON.stringify(attachments);
};
