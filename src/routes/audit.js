import { Router } from 'express';
import { prisma } from '../server.js';

const router = Router();

router.get('/', async (req, res) => {
  const { entityType, entityId, userId, action, reservationId, page = 1, limit = 50 } = req.query;
  
  const where = {};
  
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (reservationId) where.reservationId = reservationId;
  
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
  ]);
  
  const formattedLogs = logs.map(log => ({
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
    newValue: log.newValue ? JSON.parse(log.newValue) : null
  }));
  
  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    logs: formattedLogs
  });
});

router.get('/reservation/:id', async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { reservationId: req.params.id },
    include: {
      user: { select: { name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const formattedLogs = logs.map(log => ({
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
    newValue: log.newValue ? JSON.parse(log.newValue) : null
  }));
  
  res.json(formattedLogs);
});

export default router;
