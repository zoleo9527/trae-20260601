const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    let baseQuery = {};
    
    if (userRole === 'PHARMACIST') {
      baseQuery = {
        status: {
          in: ['PENDING_REVIEW', 'SUPPLEMENT_REQUIRED']
        }
      };
    } else if (userRole === 'DISPENSER') {
      baseQuery = {
        status: 'REVIEW_PASSED'
      };
    } else if (userRole === 'COURIER') {
      baseQuery = {
        status: {
          in: ['DISPENSED', 'SHIPPED']
        }
      };
    }

    const totalCount = await prisma.prescription.count({ where: baseQuery });

    const pendingReception = await prisma.prescription.count({
      where: { ...baseQuery, status: 'PENDING_RECEPTION' }
    });

    const pendingReview = await prisma.prescription.count({
      where: { ...baseQuery, status: 'PENDING_REVIEW' }
    });

    const supplementRequired = await prisma.prescription.count({
      where: { ...baseQuery, status: 'SUPPLEMENT_REQUIRED' }
    });

    const reviewRejected = await prisma.prescription.count({
      where: { ...baseQuery, status: 'REVIEW_REJECTED' }
    });

    const highRisk = await prisma.prescription.count({
      where: { ...baseQuery, riskLevel: 'HIGH_RISK' }
    });

    const recentChanges = await prisma.statusHistory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        prescription: {
          select: { prescriptionNo: true, patient: { select: { name: true } } }
        },
        operator: { select: { name: true } }
      }
    });

    res.json({
      totalCount,
      pendingReception,
      pendingReview,
      supplementRequired,
      reviewRejected,
      highRisk,
      recentChanges
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    let tasks = [];

    switch (userRole) {
      case 'RECEPTIONIST':
      case 'ADMIN':
        tasks = await prisma.prescription.findMany({
          where: {
            status: {
              in: ['PENDING_RECEPTION', 'SUPPLEMENT_REQUIRED']
            }
          },
          include: {
            patient: true,
            supplements: {
              where: { isCompleted: false },
              take: 1
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 5
        });
        break;

      case 'PHARMACIST':
        tasks = await prisma.prescription.findMany({
          where: {
            status: 'PENDING_REVIEW'
          },
          include: { patient: true },
          orderBy: {
            riskLevel: 'desc',
            createdAt: 'asc'
          },
          take: 5
        });
        break;

      case 'DISPENSER':
        tasks = await prisma.prescription.findMany({
          where: {
            status: 'REVIEW_PASSED'
          },
          include: { patient: true },
          orderBy: { createdAt: 'asc' },
          take: 5
        });
        break;

      case 'COURIER':
        tasks = await prisma.prescription.findMany({
          where: {
            status: {
              in: ['DISPENSED', 'SHIPPED']
            }
          },
          include: { patient: true },
          orderBy: { createdAt: 'asc' },
          take: 5
        });
        break;
    }

    tasks = tasks.map(t => {
      if (t.medicines && typeof t.medicines === 'string') {
        t.medicines = JSON.parse(t.medicines);
      }
      return t;
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

module.exports = router;
