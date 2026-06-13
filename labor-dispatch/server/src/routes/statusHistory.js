import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }
    const decoded = jwt.verify(token, 'labor-dispatch-secret-key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: '未授权' });
  }
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { entityType, entityId, actionType, startDate, endDate, operatorId, page = 1, pageSize = 50 } = req.query;

    const where = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    if (operatorId) {
      where.operatorId = operatorId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }
    }

    const [total, histories] = await Promise.all([
      req.prisma.statusHistory.count({ where }),
      req.prisma.statusHistory.findMany({
        where,
        include: {
          operator: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize)
      })
    ]);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      data: histories
    });
  } catch (error) {
    console.error('获取状态历史错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const history = await req.prisma.statusHistory.findUnique({
      where: { id },
      include: {
        operator: {
          select: { id: true, name: true, role: true }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!history) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(history);
  } catch (error) {
    console.error('获取状态历史详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

export default router;
