
import { Router, type Request, type Response } from 'express';
import { orders } from '../data/store.js';
import type { Order } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, stationId } = req.query;

  let filteredOrders = [...orders] as Order[];

  if (status) {
    filteredOrders = filteredOrders.filter((o) => o.status === status);
  }
  if (stationId) {
    filteredOrders = filteredOrders.filter((o) => o.stationId === stationId);
  }

  res.json({
    success: true,
    data: filteredOrders,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({
      success: false,
      message: '订单不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: order as Order,
  });
});

router.post('/:id/refund', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason, amount } = req.body as { reason: string; amount?: number };

  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({
      success: false,
      message: '订单不存在',
    });
    return;
  }

  order.status = 'refunded';
  order.refundAmount = amount || order.amount;
  order.refundReason = reason;

  res.json({
    success: true,
    data: order as Order,
    message: '退款申请成功',
  });
});

export default router;
