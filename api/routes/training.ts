import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { updateTrainingStatus, getTrainingById, getTrainingList } from '../services/trainingService';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, coachId, status, startDate, endDate } = req.query;

    const training = await getTrainingList({
      studentId: studentId as string,
      coachId: coachId as string,
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取学时列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const training = await getTrainingById(req.params.id);

    if (!training) {
      return res.status(404).json({ error: '学时记录不存在' });
    }

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取学时详情失败' });
  }
});

router.post('/:id/confirm', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, actualHours, actualAt, exceptionReason, reason, remark } = req.body;

    const training = await updateTrainingStatus({
      trainingId: req.params.id,
      newStatus: status,
      handlerId: user.userId,
      handlerName: '',
      handlerRole: user.role as any,
      actualHours,
      actualAt: actualAt ? new Date(actualAt) : undefined,
      exceptionReason,
      reason,
      remark,
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (updatedUser) {
      await updateTrainingStatus({
        trainingId: req.params.id,
        newStatus: status,
        handlerId: user.userId,
        handlerName: updatedUser.realName,
        handlerRole: updatedUser.role,
        actualHours,
        actualAt: actualAt ? new Date(actualAt) : undefined,
        exceptionReason,
        reason,
        remark,
      });
    }

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '确认失败' });
  }
});

router.post('/:id/exception', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { exceptionReason, reason, remark } = req.body;

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });

    const training = await updateTrainingStatus({
      trainingId: req.params.id,
      newStatus: 'exception',
      handlerId: user.userId,
      handlerName: updatedUser?.realName || '',
      handlerRole: updatedUser?.role || 'coach',
      exceptionReason,
      reason,
      remark,
    });

    res.json({ training });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '标记异常失败' });
  }
});

export default router;
