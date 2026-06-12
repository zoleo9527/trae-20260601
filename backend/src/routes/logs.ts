import express from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, (req: AuthRequest, res) => {
  const { entityType, entityId, operatorId, action, page = 1, pageSize = 50 } = req.query;
  let logs = [...db.operationLogs];

  if (entityType) {
    logs = logs.filter((l) => l.entityType === entityType);
  }
  if (entityId) {
    logs = logs.filter((l) => l.entityId === entityId);
  }
  if (operatorId) {
    logs = logs.filter((l) => l.operatorId === operatorId);
  }
  if (action) {
    logs = logs.filter((l) => l.action.includes(action as string));
  }

  const total = logs.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const end = start + Number(pageSize);
  const paginatedLogs = logs.slice(start, end);

  res.json({
    list: paginatedLogs,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  });
});

router.get('/entity/:entityType/:entityId', authenticate, (req, res) => {
  const { entityType, entityId } = req.params;
  const logs = db.operationLogs.filter(
    (log) => log.entityType === entityType && log.entityId === entityId
  );

  res.json(logs);
});

router.get('/timeline/:entityType/:entityId', authenticate, (req, res) => {
  const { entityType, entityId } = req.params;
  const logs = db.operationLogs.filter(
    (log) => log.entityType === entityType && log.entityId === entityId
  );

  const timeline = logs.map((log) => ({
    key: log.id,
    title: log.action,
    description: log.description,
    operator: log.operatorName,
    operatorRole: log.operatorRole,
    timestamp: log.timestamp,
    oldStatus: log.oldStatus,
    newStatus: log.newStatus,
    details: log.details,
  }));

  res.json(timeline);
});

export default router;
