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
    const { status, returnType, entityType, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (returnType) {
      where.returnType = returnType;
    }

    if (entityType) {
      where.entityType = entityType;
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

    const [total, records] = await Promise.all([
      req.prisma.returnRecord.count({ where }),
      req.prisma.returnRecord.findMany({
        where,
        include: {
          operator: {
            select: { id: true, name: true, role: true }
          },
          laborDemand: {
            select: { id: true, demandNumber: true, companyName: true, position: true }
          },
          candidate: {
            select: { id: true, name: true, phone: true }
          },
          matchingRecord: {
            select: { id: true }
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
      data: records
    });
  } catch (error) {
    console.error('获取退回记录列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const record = await req.prisma.returnRecord.findUnique({
      where: { id },
      include: {
        operator: {
          select: { id: true, name: true, role: true }
        },
        laborDemand: {
          select: { id: true, demandNumber: true, companyName: true, position: true, status: true }
        },
        candidate: {
          select: { id: true, name: true, phone: true, skills: true, status: true }
        },
        matchingRecord: {
          select: { id: true, status: true, matchType: true }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(record);
  } catch (error) {
    console.error('获取退回记录详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.put('/:id/handle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { handleRemark } = req.body;

    const existing = await req.prisma.returnRecord.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const record = await req.prisma.returnRecord.update({
      where: { id },
      data: {
        status: '已处理',
        handledById: req.userId,
        handledAt: new Date(),
        handleRemark
      },
      include: {
        operator: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    res.json(record);
  } catch (error) {
    console.error('处理退回记录错误:', error);
    res.status(500).json({ error: '处理失败' });
  }
});

export default router;
