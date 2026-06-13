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
            select: { id: true, status: true, matchType: true }
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
          include: {
            laborDemand: {
              select: { id: true, companyName: true, position: true }
            },
            candidate: {
              select: { id: true, name: true, phone: true }
            }
          }
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
    const { handleRemark, handleResult } = req.body;

    const existing = await req.prisma.returnRecord.findUnique({
      where: { id },
      include: {
        matchingRecord: {
          include: { laborDemand: true, candidate: true }
        },
        laborDemand: true,
        candidate: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    if (existing.status !== '待处理') {
      return res.status(400).json({ error: '该记录已处理' });
    }

    let matchingNewStatus = '已处理';
    let laborDemandNewStatus = existing.matchingRecord?.laborDemand?.status || existing.laborDemand?.status;
    let candidateNewStatus = existing.matchingRecord?.candidate?.status || existing.candidate?.status;

    if (handleResult === '重新匹配') {
      matchingNewStatus = '待确认';
      laborDemandNewStatus = '匹配中';
      candidateNewStatus = '匹配中';
    } else if (handleResult === '取消匹配') {
      matchingNewStatus = '已取消';
      laborDemandNewStatus = '处理中';
      candidateNewStatus = '待匹配';
    } else if (handleResult === '继续处理') {
      matchingNewStatus = '已处理';
    }

    const record = await req.prisma.returnRecord.update({
      where: { id },
      data: {
        status: '已处理',
        handledById: req.userId,
        handledAt: new Date(),
        handleRemark: handleRemark || handleResult
      },
      include: {
        operator: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (existing.matchingRecord) {
      await req.prisma.matchingRecord.update({
        where: { id: existing.matchingRecordId },
        data: { status: matchingNewStatus }
      });

      await Promise.all([
        req.prisma.laborDemand.update({
          where: { id: existing.matchingRecord.laborDemandId },
          data: { status: laborDemandNewStatus }
        }),
        req.prisma.candidate.update({
          where: { id: existing.matchingRecord.candidateId },
          data: { status: candidateNewStatus }
        })
      ]);

      await Promise.all([
        req.prisma.statusHistory.create({
          data: {
            entityType: 'MatchingRecord',
            entityId: existing.matchingRecordId,
            previousStatus: existing.matchingRecord.status,
            newStatus: matchingNewStatus,
            actionType: '一线处理',
            operatorId: req.userId,
            remark: handleRemark || `一线处理${existing.returnType}：${handleResult}`
          }
        }),
        req.prisma.statusHistory.create({
          data: {
            entityType: 'LaborDemand',
            entityId: existing.matchingRecord.laborDemandId,
            previousStatus: existing.matchingRecord.laborDemand.status,
            newStatus: laborDemandNewStatus,
            actionType: '一线处理',
            operatorId: req.userId,
            remark: `一线处理${existing.returnType}：${handleResult}`
          }
        }),
        req.prisma.statusHistory.create({
          data: {
            entityType: 'Candidate',
            entityId: existing.matchingRecord.candidateId,
            previousStatus: existing.matchingRecord.candidate.status,
            newStatus: candidateNewStatus,
            actionType: '一线处理',
            operatorId: req.userId,
            remark: `一线处理${existing.returnType}：${handleResult}`
          }
        })
      ]);
    }

    res.json({
      record,
      message: '处理成功，等待管理复核'
    });
  } catch (error) {
    console.error('处理退回记录错误:', error);
    res.status(500).json({ error: '处理失败' });
  }
});

router.post('/:id/rehandle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { handleRemark, handleResult } = req.body;

    const existing = await req.prisma.returnRecord.findUnique({
      where: { id },
      include: {
        matchingRecord: {
          include: { laborDemand: true, candidate: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    if (existing.status === '已确认') {
      return res.status(400).json({ error: '该记录已确认，无法重新处理' });
    }

    let matchingNewStatus = '已处理';
    let laborDemandNewStatus = existing.matchingRecord?.laborDemand?.status;
    let candidateNewStatus = existing.matchingRecord?.candidate?.status;

    if (handleResult === '重新匹配') {
      matchingNewStatus = '待确认';
      laborDemandNewStatus = '匹配中';
      candidateNewStatus = '匹配中';
    } else if (handleResult === '取消匹配') {
      matchingNewStatus = '已取消';
      laborDemandNewStatus = '处理中';
      candidateNewStatus = '待匹配';
    }

    const record = await req.prisma.returnRecord.update({
      where: { id },
      data: {
        status: '已处理',
        handledById: req.userId,
        handledAt: new Date(),
        handleRemark: handleRemark || handleResult
      },
      include: {
        operator: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (existing.matchingRecord) {
      await req.prisma.matchingRecord.update({
        where: { id: existing.matchingRecordId },
        data: { status: matchingNewStatus }
      });

      await Promise.all([
        req.prisma.laborDemand.update({
          where: { id: existing.matchingRecord.laborDemandId },
          data: { status: laborDemandNewStatus }
        }),
        req.prisma.candidate.update({
          where: { id: existing.matchingRecord.candidateId },
          data: { status: candidateNewStatus }
        })
      ]);

      await Promise.all([
        req.prisma.statusHistory.create({
          data: {
            entityType: 'MatchingRecord',
            entityId: existing.matchingRecordId,
            previousStatus: existing.matchingRecord.status,
            newStatus: matchingNewStatus,
            actionType: '重新处理',
            operatorId: req.userId,
            remark: handleRemark || `重新处理${existing.returnType}：${handleResult}`
          }
        }),
        req.prisma.statusHistory.create({
          data: {
            entityType: 'LaborDemand',
            entityId: existing.matchingRecord.laborDemandId,
            previousStatus: existing.matchingRecord.laborDemand.status,
            newStatus: laborDemandNewStatus,
            actionType: '重新处理',
            operatorId: req.userId,
            remark: `重新处理${existing.returnType}：${handleResult}`
          }
        }),
        req.prisma.statusHistory.create({
          data: {
            entityType: 'Candidate',
            entityId: existing.matchingRecord.candidateId,
            previousStatus: existing.matchingRecord.candidate.status,
            newStatus: candidateNewStatus,
            actionType: '重新处理',
            operatorId: req.userId,
            remark: `重新处理${existing.returnType}：${handleResult}`
          }
        })
      ]);
    }

    res.json({
      record,
      message: '重新处理成功'
    });
  } catch (error) {
    console.error('重新处理退回记录错误:', error);
    res.status(500).json({ error: '重新处理失败' });
  }
});

export default router;