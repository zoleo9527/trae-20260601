import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { updatePaymentStatus, getPaymentById, getPaymentList, calculateRefund } from '../services/paymentService';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, paymentType, status, handlerId, search, startDate, endDate } = req.query;

    const payments = await getPaymentList({
      studentId: studentId as string,
      paymentType: paymentType as any,
      status: status as any,
      handlerId: handlerId as string,
      search: search as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取费用列表失败' });
  }
});

router.get('/student/:studentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await getPaymentList({
      studentId: req.params.studentId,
    });

    const summary = await calculateRefund(req.params.studentId);

    res.json({ payments, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取学员费用失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: '费用记录不存在' });
    }

    res.json({ payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取费用详情失败' });
  }
});

router.post('/:id/settle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, refundReason, paidAt, settledAt, reason, remark } = req.body;

    const updatedUser = await prisma.user.findUnique({ where: { id: user.userId } });

    const payment = await updatePaymentStatus({
      paymentId: req.params.id,
      newStatus: status,
      handlerId: user.userId,
      handlerName: updatedUser?.realName || '',
      handlerRole: updatedUser?.role || 'advisor',
      refundReason,
      paidAt: paidAt ? new Date(paidAt) : undefined,
      settledAt: settledAt ? new Date(settledAt) : undefined,
      reason,
      remark,
    });

    res.json({ payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '结算失败' });
  }
});

export default router;
