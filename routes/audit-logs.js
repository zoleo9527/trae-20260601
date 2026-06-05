const { Router } = require('express');
const { prisma, paginate, filterAuditLogs } = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page, pageSize, skip, take } = paginate(req.query);
    const where = filterAuditLogs(req.query);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where })
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
