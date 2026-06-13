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

router.post('/', authenticate, async (req, res) => {
  try {
    const { companyName, position, demandCount, salaryRange, workLocation, workPeriod, requirements } = req.body;

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await req.prisma.laborDemand.count();
    const demandNumber = `DEM-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const laborDemand = await req.prisma.laborDemand.create({
      data: {
        demandNumber,
        companyName,
        position,
        demandCount,
        salaryRange,
        workLocation,
        workPeriod,
        requirements,
        createdById: req.userId
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await req.prisma.statusHistory.create({
      data: {
        entityType: 'LaborDemand',
        entityId: laborDemand.id,
        previousStatus: null,
        newStatus: '待处理',
        actionType: '创建',
        operatorId: req.userId,
        remark: '创建用工需求'
      }
    });

    res.json(laborDemand);
  } catch (error) {
    console.error('创建用工需求错误:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, companyName, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (companyName) {
      where.companyName = { contains: companyName };
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

    const [total, demands] = await Promise.all([
      req.prisma.laborDemand.count({ where }),
      req.prisma.laborDemand.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, role: true }
          },
          _count: {
            select: { matchingRecords: true }
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
      data: demands
    });
  } catch (error) {
    console.error('获取用工需求列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const demand = await req.prisma.laborDemand.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        },
        matchingRecords: {
          include: {
            candidate: {
              select: { id: true, name: true, phone: true, skills: true }
            },
            createdBy: {
              select: { id: true, name: true }
            }
          }
        },
        statusHistories: {
          include: {
            operator: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        returnRecords: {
          include: {
            operator: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
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

    if (!demand) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(demand);
  } catch (error) {
    console.error('获取用工需求详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, position, demandCount, salaryRange, workLocation, workPeriod, requirements } = req.body;

    const existing = await req.prisma.laborDemand.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const laborDemand = await req.prisma.laborDemand.update({
      where: { id },
      data: {
        companyName,
        position,
        demandCount,
        salaryRange,
        workLocation,
        workPeriod,
        requirements
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await req.prisma.statusHistory.create({
      data: {
        entityType: 'LaborDemand',
        entityId: laborDemand.id,
        previousStatus: existing.status,
        newStatus: existing.status,
        actionType: '更新',
        operatorId: req.userId,
        remark: '更新用工需求信息'
      }
    });

    res.json(laborDemand);
  } catch (error) {
    console.error('更新用工需求错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const existing = await req.prisma.laborDemand.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const laborDemand = await req.prisma.laborDemand.update({
      where: { id },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await req.prisma.statusHistory.create({
      data: {
        entityType: 'LaborDemand',
        entityId: laborDemand.id,
        previousStatus: existing.status,
        newStatus: status,
        actionType: '状态更新',
        operatorId: req.userId,
        remark: remark || `状态变更为：${status}`
      }
    });

    res.json(laborDemand);
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.laborDemand.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除用工需求错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
