import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { getStatusLogs } from '../services/statusLogService';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { advisorId, coachId, status, search } = req.query;

    const where: any = {};

    if (advisorId) {
      where.advisorId = advisorId;
    }

    if (coachId) {
      where.coachId = coachId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        advisor: true,
        coach: true,
        trainingHours: {
          where: { status: 'completed' },
          select: { actualHours: true },
        },
        payments: {
          where: { status: 'settled' },
          select: { amount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const studentsWithSummary = students.map(student => ({
      ...student,
      totalHours: student.trainingHours.reduce((sum, t) => sum + Number(t.actualHours || 0), 0),
      totalPaid: student.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }));

    res.json({ students: studentsWithSummary });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取学员列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        advisor: true,
        coach: true,
        trainingHours: {
          include: {
            statusLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
        payments: {
          include: {
            statusLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        examBookings: {
          include: {
            statusLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: '学员不存在' });
    }

    const allStatusLogs = [
      ...student.trainingHours.flatMap(t => t.statusLogs.map(log => ({
        ...log,
        entityType: 'training_hours',
        entityId: t.id,
      }))),
      ...student.payments.flatMap(p => p.statusLogs.map(log => ({
        ...log,
        entityType: 'payment',
        entityId: p.id,
      }))),
      ...student.examBookings.flatMap(e => e.statusLogs.map(log => ({
        ...log,
        entityType: 'exam_booking',
        entityId: e.id,
      }))),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ student, statusLogs: allStatusLogs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取学员详情失败' });
  }
});

export default router;
