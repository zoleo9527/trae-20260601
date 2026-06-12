"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeAttachmentJson = exports.parseAttachmentJson = exports.generateTimeline = exports.getOperationLogs = exports.logOperation = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const fieldConverter_1 = require("./fieldConverter");
const logOperation = async (entityType, entityId, action, description, operatorId, operatorName, operatorRole, oldStatus, newStatus, details) => {
    const db = await (0, database_1.getDb)();
    const log = {
        id: (0, uuid_1.v4)(),
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
    await db.run(`INSERT INTO operation_logs (
      id, entity_type, entity_id, action, description,
      operator_id, operator_name, operator_role, old_status,
      new_status, details, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
    ]);
};
exports.logOperation = logOperation;
const getOperationLogs = async (entityType, entityId) => {
    const db = await (0, database_1.getDb)();
    const logs = await db.all(`SELECT * FROM operation_logs 
     WHERE entity_type = ? AND entity_id = ? 
     ORDER BY timestamp DESC`, [entityType, entityId]);
    return logs.map((log) => fieldConverter_1.convertFields.operationLog(log));
};
exports.getOperationLogs = getOperationLogs;
const generateTimeline = (logs, exceptions = [], attachments = []) => {
    const events = [];
    logs.forEach((log) => {
        const type = log.oldStatus && log.newStatus ? 'status_change' : 'action';
        events.push({
            id: log.id,
            time: log.timestamp,
            type,
            title: log.action,
            content: log.description,
            operatorId: log.operatorId,
            operatorName: log.operatorName,
            operatorRole: log.operatorRole,
            attachments: [],
            metadata: log.details,
        });
    });
    exceptions.forEach((ex) => {
        events.push({
            id: ex.id,
            time: ex.triggeredAt || ex.triggered_at || ex.createdAt,
            type: 'exception',
            title: `[${ex.severity === 'critical' ? '严重' : ex.severity === 'high' ? '高' : ex.severity === 'medium' ? '中' : '低'}] ${ex.title}`,
            content: ex.description,
            operatorId: null,
            operatorName: null,
            operatorRole: null,
            attachments: ex.attachments || [],
            metadata: {
                exceptionType: ex.type,
                severity: ex.severity,
                status: ex.status,
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
exports.generateTimeline = generateTimeline;
const formatFileSize = (bytes) => {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};
const parseAttachmentJson = (json) => {
    if (!json)
        return [];
    try {
        return JSON.parse(json);
    }
    catch {
        return [];
    }
};
exports.parseAttachmentJson = parseAttachmentJson;
const serializeAttachmentJson = (attachments) => {
    return JSON.stringify(attachments);
};
exports.serializeAttachmentJson = serializeAttachmentJson;
//# sourceMappingURL=operationLogger.js.map