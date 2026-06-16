import { Router } from 'express';
import { AuditLog } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  const { action, targetType, actor } = req.query;
  const whereClause: Record<string, unknown> = {};
  
  if (action) {
    whereClause.action = action;
  }
  if (targetType) {
    whereClause.targetType = targetType;
  }
  if (actor) {
    whereClause.actor = actor;
  }

  const logs = await AuditLog.findAll({
    where: whereClause,
    order: [['timestamp', 'DESC']],
  });
  res.json(logs);
});

router.get('/:id', async (req, res) => {
  const log = await AuditLog.findByPk(req.params.id);
  if (!log) {
    return res.status(404).json({ error: '审计日志不存在' });
  }
  res.json(log);
});

export default router;
