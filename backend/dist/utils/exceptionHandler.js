"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectExceptions = exports.checkAndTriggerExceptions = exports.rejectException = exports.handleException = exports.sendExceptionNotifications = exports.createException = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const types_1 = require("../types");
const operationLogger_1 = require("./operationLogger");
const fieldConverter_1 = require("./fieldConverter");
const getSeverityByType = (type) => {
    const severityMap = {
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
const getNotificationTypeBySeverity = (severity) => {
    const map = {
        low: 'info',
        medium: 'reminder',
        high: 'warning',
        critical: 'alert',
    };
    return map[severity];
};
const createException = async (projectId, projectNo, projectName, type, title, description, triggeredBy, triggerSource = 'system', triggerCondition, operatorId, operatorName, operatorRole) => {
    const db = await (0, database_1.getDb)();
    const severity = getSeverityByType(type);
    const exception = {
        id: (0, uuid_1.v4)(),
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
    await db.run(`INSERT INTO exception_records (
      id, project_id, project_no, project_name, type, severity, status,
      title, description, triggered_at, triggered_by, trigger_source,
      handler_id, handler_name, handler_role, handled_at, resolution,
      auto_trigger, trigger_condition, attachments, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
    ]);
    await (0, operationLogger_1.logOperation)('exception', exception.id, `触发${types_1.exceptionTypeNames[type]}`, description, operatorId || 'system', operatorName || '系统', operatorRole || 'project_specialist', undefined, 'open', {
        exceptionType: type,
        severity,
        autoTrigger: triggerSource === 'system',
    });
    await (0, exports.sendExceptionNotifications)(exception);
    return exception;
};
exports.createException = createException;
const sendExceptionNotifications = async (exception) => {
    const db = await (0, database_1.getDb)();
    const notificationType = getNotificationTypeBySeverity(exception.severity);
    const users = await db.all(`SELECT id, name, role FROM users WHERE role IN ('project_specialist', 'review_secretary', 'finance')`);
    for (const user of users) {
        const userObj = fieldConverter_1.convertFields.user(user);
        const notification = {
            id: (0, uuid_1.v4)(),
            userId: userObj.id,
            userName: userObj.name,
            userRole: userObj.role,
            type: notificationType,
            title: `异常提醒：${exception.title}`,
            content: `项目「${exception.projectName}」发生${types_1.exceptionTypeNames[exception.type]}异常：${exception.description}`,
            relatedEntityType: 'exception',
            relatedEntityId: exception.id,
            isRead: false,
            readAt: null,
            actionRequired: true,
            actionUrl: `/exceptions/${exception.id}`,
            createdAt: new Date().toISOString(),
        };
        await db.run(`INSERT INTO notifications (
        id, user_id, user_name, user_role, type, title, content,
        related_entity_type, related_entity_id, is_read, read_at,
        action_required, action_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
    }
};
exports.sendExceptionNotifications = sendExceptionNotifications;
const handleException = async (exceptionId, handlerId, handlerName, handlerRole, resolution) => {
    const db = await (0, database_1.getDb)();
    const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
    if (!exception)
        return null;
    const exceptionObj = fieldConverter_1.convertFields.exception(exception);
    const handledAt = new Date().toISOString();
    await db.run(`UPDATE exception_records SET 
        status = 'resolved',
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        handled_at = ?,
        resolution = ?,
        updated_at = ?
       WHERE id = ?`, [handlerId, handlerName, handlerRole, handledAt, resolution, handledAt, exceptionId]);
    await (0, operationLogger_1.logOperation)('exception', exceptionId, '处理异常', resolution, handlerId, handlerName, handlerRole, 'open', 'resolved', { resolution });
    const updated = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
    return updated ? fieldConverter_1.convertFields.exception(updated) : null;
};
exports.handleException = handleException;
const rejectException = async (exceptionId, handlerId, handlerName, handlerRole, rejectReason) => {
    const db = await (0, database_1.getDb)();
    const exception = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
    if (!exception)
        return null;
    const exceptionObj = fieldConverter_1.convertFields.exception(exception);
    const handledAt = new Date().toISOString();
    await db.run(`UPDATE exception_records SET 
        status = 'closed',
        handler_id = ?,
        handler_name = ?,
        handler_role = ?,
        handled_at = ?,
        resolution = ?,
        updated_at = ?
       WHERE id = ?`, [handlerId, handlerName, handlerRole, handledAt, `退回：${rejectReason}`, handledAt, exceptionId]);
    await (0, operationLogger_1.logOperation)('exception', exceptionId, '退回异常', rejectReason, handlerId, handlerName, handlerRole, 'open', 'closed', { rejectReason });
    const updated = await db.get('SELECT * FROM exception_records WHERE id = ?', [exceptionId]);
    return updated ? fieldConverter_1.convertFields.exception(updated) : null;
};
exports.rejectException = rejectException;
const checkAndTriggerExceptions = async (project, arrangement, signinRecords, autoCheckType, checkCondition) => {
    const db = await (0, database_1.getDb)();
    const existing = await db.get(`SELECT * FROM exception_records 
     WHERE project_id = ? AND type = ? AND status IN ('open', 'processing')`, [project.id, autoCheckType]);
    if (existing) {
        return null;
    }
    const title = types_1.exceptionTypeNames[autoCheckType];
    const descriptions = {
        arrangement_timeout: '开评标安排审核已超过24小时未处理',
        expert_absent: '有专家缺席，需要及时处理',
        expert_late: '有专家迟到',
        signin_incomplete: '专家签到超时未完成',
        room_conflict: '开标会议室存在时间冲突',
        document_missing: '缺少必要的招标文件',
        financial_issue: '财务确认存在问题',
        other: '其他异常情况',
    };
    return (0, exports.createException)(project.id, project.projectNo, project.name, autoCheckType, title, descriptions[autoCheckType], 'system', 'system', checkCondition);
};
exports.checkAndTriggerExceptions = checkAndTriggerExceptions;
const getProjectExceptions = async (projectId) => {
    const db = await (0, database_1.getDb)();
    const exceptions = await db.all('SELECT * FROM exception_records WHERE project_id = ? ORDER BY triggered_at DESC', [projectId]);
    return exceptions.map((ex) => ({
        ...ex,
        autoTrigger: ex.auto_trigger === 1,
        attachments: JSON.parse(ex.attachments || '[]'),
    }));
};
exports.getProjectExceptions = getProjectExceptions;
//# sourceMappingURL=exceptionHandler.js.map