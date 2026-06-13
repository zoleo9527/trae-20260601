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

router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      laborDemandStats,
      candidateStats,
      matchingStats,
      returnRecordStats,
      recentActivity
    ] = await Promise.all([
      req.prisma.laborDemand.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      req.prisma.candidate.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      req.prisma.matchingRecord.groupBy({
        by: ['status', 'matchType'],
        _count: { status: true }
      }),
      req.prisma.returnRecord.groupBy({
        by: ['status', 'returnType'],
        _count: { status: true }
      }),
      req.prisma.statusHistory.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: {
            select: { id: true, name: true, role: true }
          }
        }
      })
    ]);

    const laborDemandTotal = await req.prisma.laborDemand.count();
    const candidateTotal = await req.prisma.candidate.count();
    const matchingTotal = await req.prisma.matchingRecord.count();
    const returnRecordTotal = await req.prisma.returnRecord.count({
      where: { createdAt: { gte: weekAgo } }
    });

    const laborDemandByStatus = {};
    laborDemandStats.forEach(stat => {
      laborDemandByStatus[stat.status] = stat._count.status;
    });

    const candidateByStatus = {};
    candidateStats.forEach(stat => {
      candidateByStatus[stat.status] = stat._count.status;
    });

    const matchingByStatus = {};
    matchingStats.forEach(stat => {
      matchingByStatus[stat.status] = (matchingByStatus[stat.status] || 0) + stat._count.status;
    });

    const returnRecordByStatus = {};
    returnRecordStats.forEach(stat => {
      returnRecordByStatus[stat.returnType] = (returnRecordByStatus[stat.returnType] || 0) + stat._count.status;
    });

    res.json({
      laborDemand: {
        total: laborDemandTotal,
        byStatus: laborDemandByStatus
      },
      candidate: {
        total: candidateTotal,
        byStatus: candidateByStatus
      },
      matching: {
        total: matchingTotal,
        byStatus: matchingByStatus
      },
      returnRecord: {
        total: returnRecordTotal,
        byType: returnRecordByStatus
      },
      recentActivity
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/todo-list', authenticate, async (req, res) => {
  try {
    const { role } = req.query;

    let where = {};

    if (role === '一线') {
      where = {
        OR: [
          { status: '待确认' },
          { status: '待处理' }
        ]
      };
    } else if (role === '管理') {
      where = {
        status: '已处理'
      };
    }

    const [pendingDemands, pendingMatchings, pendingReturns] = await Promise.all([
      req.prisma.laborDemand.findMany({
        where: { status: '待处理' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true }
          }
        }
      }),
      req.prisma.matchingRecord.findMany({
        where: { status: '待确认' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          laborDemand: {
            select: { companyName: true, position: true }
          },
          candidate: {
            select: { name: true }
          },
          createdBy: {
            select: { name: true }
          }
        }
      }),
      req.prisma.returnRecord.findMany({
        where: { status: '待处理' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          operator: {
            select: { name: true }
          },
          matchingRecord: {
            select: { id: true }
          }
        }
      })
    ]);

    res.json({
      pendingDemands,
      pendingMatchings,
      pendingReturns
    });
  } catch (error) {
    console.error('获取待办列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

export default router;
