const router = require('express').Router();
const { db, successResponse } = require('../data/database');

function convertToAuditLogDTO(log) {
  return {
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    detail: log.detail,
    performedBy: log.performedBy?.username,
    performedByName: log.performedBy?.realName,
    performedAt: log.performedAt,
    ipAddress: log.ipAddress
  };
}

router.get('/:targetType/:targetId', (req, res) => {
  const { targetType, targetId } = req.params;
  const logs = db.auditLogs
    .filter(l => l.targetType === targetType.toUpperCase() && l.targetId === parseInt(targetId))
    .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
    .map(convertToAuditLogDTO);

  successResponse(res, logs);
});

router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const logs = db.auditLogs
    .filter(l => l.performedBy && l.performedBy.id === userId)
    .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
    .map(convertToAuditLogDTO);

  successResponse(res, logs);
});

module.exports = { auditRouter: router };
