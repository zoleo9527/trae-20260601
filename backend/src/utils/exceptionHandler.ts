import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import {
  ExceptionRecord,
  ExceptionType,
  ExceptionSeverity,
  UserRole,
  Notification,
  NotificationType,
  exceptionTypeNames,
  Project,
} from '../types';
import { logOperation } from './operationLogger';
import { convertToCamelCase, convertFields } from './fieldConverter';

const getSeverityByType = (type: ExceptionType): ExceptionSeverity => {
  const severityMap: Record<ExceptionType, ExceptionSeverity> = {
    arrangement_timeout: 'high',
    expert_absent: 'high',
    expert_late: 'medium',
    signin_incomplete: 'critical',
    room_conflict: 'high',
    document_missing: 'medium',
    financial_issue: 'high',
    other: 'low',
  };
  return severityMap[type] || 'medium';
};

const getNotificationTypeBySeverity = (severity: ExceptionSeverity): NotificationType => {
  const map: Record<ExceptionSeverity, NotificationType> = {
    low: 'info',
    medium: 'reminder',
    high: 'warning',
    critical: 'alert',
  };
  return map[severity];
};

export const createException = async (
  projectId: string,
  projectNo: string,
  projectName: string,
  type: ExceptionType,
  title: string,
  description: string,
  triggeredBy: string,
  triggerSource: 'system' | 'manual' = 'system',
  triggerCondition?: string,
  operatorId?: string,
  operatorName?: string,
  operatorRole?: UserRole
): Promise<ExceptionRecord> => {
  const db = await getDb();
  const severity = getSeverityByType(type);

  const exception: ExceptionRecord = {
    id: uuidv4(),
    projectId,
    projectNo,
    projectName,
    type,
    severity,
    status: 'open',
    title,
    description,
    triggeredAt: new Date().toISOString(),
    triggeredBy,
    triggerSource,
    handlerId: null,
    handlerName: null,
    handlerRole: null,
    handledAt: null,
    resolution: null,
    autoTrigger: triggerSource === 'system',
    triggerCondition: triggerCondition || null,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.run(
    `INSERT INTO exception_records (
      id, project_id, project_no, project_name, type, severity, status,
      title, description, triggered_at, triggered_by, trigger_source,
      handler_id, handler_name, handler_role, handled_at, resolution,
      auto_trigger, trigger_condition, attachments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exception.id,
      exception.projectId,
      exception.projectNo,
      exception.projectName,
      exception.type,
      exception.severity,
      exception.status,
      exception.title,
      exception.description,
      exception.triggeredAt,
      exception.triggeredBy,
      exception.triggerSource,
      exception.handlerId,
      exception.handlerName,
      exception.handlerRole,
      exception.handledAt,
      exception.resolution,
      exception.autoTrigger ? 1 : 0,
      exception.triggerCondition,
      JSON.stringify(exception.attachments),
      exception.createdAt,
      exception.updatedAt,
    ]
  );

  await logOperation(
    'exception',
    exception.id,
    `触发${exceptionTypeNames[type]}`,
    description,
    operatorId || 'system',
    operatorName || '系统',
    operatorRole || 'project_specialist',
    undefined,
    'open',
    {
      exceptionType: type,
      severity,
      autoTrigger: triggerSource === 'system',
    }
  );

  await sendExceptionNotifications(exception);

  return exception;
};

export const sendExceptionNotifications = async (exception: ExceptionRecord): Promise<void> => {
  const db = await getDb();
  const notificationType = getNotificationTypeBySeverity(exception.severity);

  const users = await db.all(
    `SELECT id, name, role FROM users WHERE role IN ('project_specialist', 'review_secretary', 'finance')`
  );

  for (const user of users) {
    const userObj = convertFields.user(user);
    const notification: Notification = {
      id: uuidv4(),
      userId: userObj.id,
      userName: userObj.name,
      userRole: userObj.role,
      type: notificationType,
      title: `异常提醒：${exception.title}`,
      content: `项目「${exception.projectName}」发生${exceptionTypeNames[exception.type]}异常：${exception.description}`,
      relatedEntityType: 'exception',
      relatedEntityId: exception.id,
      isRead: false,
      readAt: null,
      actionRequired: true,
      actionUrl: `/exceptions/${exception.id}`,
      createdAt: new Date().toISOString(),
    };

    await db.run(
      `INSERT INTO notifications (
        id, user_id, user_name, user_role, type, title, content,
        related_entity_type, related_entity_id, is_read, read_at,
        action_required, action_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.userId,
        notification.userName,
        notification.userRole,
        notification.type,
        notification.title,
        notification.content,
        notification.relatedEntityType,
        notification.relatedEntityId,
        notification.isRead ? 1 : 0,
        notification.readAt,
        notification.actionRequired ? 1 : 0,
        notification.actionUrl,
        notification.createdAt,
      ]
    );
  }
};

export const handleException = async (
  exceptionId: string,
  handlerId: string,
  handlerName: string,
  handlerRole: UserRole,
  resolution: string
): Promise<ExceptionRecord | null> => {
  const db = await getDb();

  const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
  if (!exception) return null;

  const exceptionObj = convertFields.exception(exception);
  const handledAt = new Date().toISOString();

  await db.run(
    `UPDATE exception_records SET 
        status = 'resolved',
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        handled_at = ?,
        resolution = ?,
        updated_at = ?
       WHERE id = ?`,
    [handlerId, handlerName, handlerRole, handledAt, resolution, handledAt, exceptionId]
  );

  await logOperation(
    'exception',
    exceptionId,
    '处理异常',
    resolution,
    handlerId,
    handlerName,
    handlerRole,
    'open',
    'resolved',
    { resolution }
  );

  const updated = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
  return updated ? convertFields.exception(updated) : null;
};

export const rejectException = async (
  exceptionId: string,
  handlerId: string,
  handlerName: string,
  handlerRole: UserRole,
  rejectReason: string
): Promise<ExceptionRecord | null> => {
  const db = await getDb();

  const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
  if (!exception) return null;

  const exceptionObj = convertFields.exception(exception);
  const handledAt = new Date().toISOString();

  await db.run(
    `UPDATE exception_records SET 
        status = 'closed',
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        handled_at = ?,
        resolution = ?,
        updated_at = ?
       WHERE id = ?`,
    [handlerId, handlerName, handlerRole, handledAt, `退回：${rejectReason}`, handledAt, exceptionId]
  );

  await logOperation(
    'exception',
    exceptionId,
    '退回异常',
    rejectReason,
    handlerId,
    handlerName,
    handlerRole,
    'open',
    'closed',
    { rejectReason }
  );

  const updated = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
  return updated ? convertFields.exception(updated) : null;
};

export const checkAndTriggerExceptions = async (
  project: Project,
  arrangement: any,
  signinRecords: any[],
  autoCheckType: ExceptionType,
  checkCondition: string
): Promise<ExceptionRecord | null> => {
  const db = await getDb();

  const existing = await db.get(
    `SELECT * FROM exception_records 
     WHERE project_id = ? AND type = ? AND status IN ('open', 'processing')`,
    [project.id, autoCheckType]
  );

  if (existing) {
    return null;
  }

  const title = exceptionTypeNames[autoCheckType];
  const descriptions: Record<ExceptionType, string> = {
    arrangement_timeout: '开评标安排审核已超过24小时未处理',
    expert_absent: '有专家缺席，需要及时处理',
    expert_late: '有专家迟到',
    signin_incomplete: '专家签到超时未完成',
    room_conflict: '开标会议室存在时间冲突',
    document_missing: '缺少必要的招标文件',
    financial_issue: '财务确认存在问题',
    other: '其他异常情况',
  };

  return createException(
    project.id,
    project.projectNo,
    project.name,
    autoCheckType,
    title,
    descriptions[autoCheckType],
    'system',
    'system',
    checkCondition
  );
};

export const getProjectExceptions = async (projectId: string): Promise<ExceptionRecord[]> => {
  const db = await getDb();
  const exceptions = await db.all(
    'SELECT * FROM exception_records WHERE project_id = ? ORDER BY triggered_at DESC',
    [projectId]
  );

  return exceptions.map((ex) => ({
    ...ex,
    autoTrigger: ex.auto_trigger === 1,
    attachments: JSON.parse(ex.attachments || '[]'),
  }));
};
