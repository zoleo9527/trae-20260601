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
    const { name, phone, email, skills, experience, education, expectedSalary } = req.body;

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await req.prisma.candidate.count();
    const candidateNumber = `CAND-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const candidate = await req.prisma.candidate.create({
      data: {
        candidateNumber,
        name,
        phone,
        email,
        skills,
        experience,
        education,
        expectedSalary,
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
        entityType: 'Candidate',
        entityId: candidate.id,
        previousStatus: null,
        newStatus: '待匹配',
        actionType: '创建',
        operatorId: req.userId,
        remark: '创建候选人'
      }
    });

    res.json(candidate);
  } catch (error) {
    console.error('创建候选人错误:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, name, skills, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (name) {
      where.name = { contains: name };
    }

    if (skills) {
      where.skills = { contains: skills };
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

    const [total, candidates] = await Promise.all([
      req.prisma.candidate.count({ where }),
      req.prisma.candidate.findMany({
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
      data: candidates
    });
  } catch (error) {
    console.error('获取候选人列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await req.prisma.candidate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        },
        matchingRecords: {
          include: {
            laborDemand: {
              select: { id: true, demandNumber: true, companyName: true, position: true }
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

    if (!candidate) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('获取候选人详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, skills, experience, education, expectedSalary } = req.body;

    const existing = await req.prisma.candidate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const candidate = await req.prisma.candidate.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        skills,
        experience,
        education,
        expectedSalary
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await req.prisma.statusHistory.create({
      data: {
        entityType: 'Candidate',
        entityId: candidate.id,
        previousStatus: existing.status,
        newStatus: existing.status,
        actionType: '更新',
        operatorId: req.userId,
        remark: '更新候选人信息'
      }
    });

    res.json(candidate);
  } catch (error) {
    console.error('更新候选人错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const existing = await req.prisma.candidate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const candidate = await req.prisma.candidate.update({
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
        entityType: 'Candidate',
        entityId: candidate.id,
        previousStatus: existing.status,
        newStatus: status,
        actionType: '状态更新',
        operatorId: req.userId,
        remark: remark || `状态变更为：${status}`
      }
    });

    res.json(candidate);
  } catch (error) {
    console.error('更新状态错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.candidate.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除候选人错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
