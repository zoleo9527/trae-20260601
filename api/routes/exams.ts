import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { updateExamStatus, getExamById, getExamList } from '../services/examService';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, status, examinerId, search, startDate, endDate } = req.query;

    const exams = await getExamList({
      studentId: studentId as string,
      status: status as any,
      examinerId: examinerId as string,
      search: search as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ exams });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取考试列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exam = await getExamById(req.params.id);

    if (!exam) {
      return res.status(404).json({ error: '考试预约不存在' });
    }

    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取考试详情失败' });
  }
});

router.post('/:id/book', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { scheduledDate, location, reason, remark } = req.body;

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });

    const exam = await updateExamStatus({
      examId: req.params.id,
      newStatus: 'booked',
      handlerId: user.userId,
      handlerName: updatedUser?.realName || '',
      handlerRole: updatedUser?.role || 'examiner',
      scheduledDate: new Date(scheduledDate),
      location,
      reason,
      remark,
    });

    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '预约失败' });
  }
});

router.post('/:id/score', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { score, retestFee, reason, remark } = req.body;

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });

    const exam = await updateExamStatus({
      examId: req.params.id,
      newStatus: score < 90 ? 'retest' : 'scored',
      handlerId: user.userId,
      handlerName: updatedUser?.realName || '',
      handlerRole: updatedUser?.role || 'examiner',
      score,
      retestFee: score < 90 ? retestFee : undefined,
      reason,
      remark,
    });

    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '录入成绩失败' });
  }
});

router.post('/:id/complete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { reason, remark } = req.body;

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });

    const exam = await updateExamStatus({
      examId: req.params.id,
      newStatus: 'completed',
      handlerId: user.userId,
      handlerName: updatedUser?.realName || '',
      handlerRole: updatedUser?.role || 'examiner',
      reason: reason || '学员完成考试',
      remark,
    });

    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '标记完成失败' });
  }
});

export default router;
