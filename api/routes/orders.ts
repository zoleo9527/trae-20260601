
import { Router, type Request, type Response } from 'express';
import { orders, settlements, settlementAdjustments, stations } from '../data/store.js';
import type { Order, Settlement, SettlementAdjustment } from '../../shared/types.js';

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
  const { reason, amount, operator } = req.body as {
    reason: string;
    amount?: number;
    operator?: string;
  };

  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({
      success: false,
      message: '订单不存在',
    });
    return;
  }

  if (order.status === 'refunded') {
    res.status(400).json({
      success: false,
      message: '订单已退款，不能重复操作',
    });
    return;
  }

  const refundAmount = amount || order.amount;

  order.status = 'refunded';
  order.refundAmount = refundAmount;
  order.refundReason = reason;

  const station = stations.find((s) => s.id === order.stationId);
  if (station) {
    const orderDate = new Date(order.startTime);
    const settlementMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

    let settlement = settlements.find(
      (s) => s.stationId === order.stationId && s.date.startsWith(settlementMonth)
    );

    if (!settlement) {
      const stationOrders = orders.filter(
        (o) => o.stationId === order.stationId
      );
      const stationTotal = stationOrders.reduce((sum, o) => sum + o.amount, 0);
      const existingRefunds = stationOrders.filter(o => o.status === 'refunded' && o.id !== order.id);
      const existingRefundTotal = existingRefunds.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
      const splitRatio = station.splitRatio || 0.7;

      const newSettlementId = `set${settlements.length + 1}`;
      settlement = {
        id: newSettlementId,
        date: settlementMonth,
        stationId: station.id,
        stationName: station.name,
        totalAmount: stationTotal - existingRefundTotal,
        platformShare: (stationTotal - existingRefundTotal) * (1 - splitRatio),
        partnerShare: (stationTotal - existingRefundTotal) * splitRatio,
        refundDeduction: existingRefundTotal,
        finalPartnerShare: (stationTotal - existingRefundTotal) * splitRatio - existingRefundTotal,
        status: 'pending',
      };
      settlements.push(settlement);
    }

    const splitRatio = station.splitRatio || 0.7;

    settlement.totalAmount = Math.max(0, settlement.totalAmount - refundAmount);
    settlement.refundDeduction += refundAmount;
    settlement.platformShare = settlement.totalAmount * (1 - splitRatio);
    settlement.partnerShare = settlement.totalAmount * splitRatio;
    settlement.finalPartnerShare = Math.max(0, settlement.partnerShare - settlement.refundDeduction);

    const adjustmentId = `adj${settlementAdjustments.length + 1}`;
    const adjustment: SettlementAdjustment = {
      id: adjustmentId,
      settlementId: settlement.id,
      stationId: station.id,
      type: 'refund',
      amount: refundAmount,
      reason: `订单${order.id}退款：${reason}`,
      operator: operator || '系统',
      createdAt: new Date().toISOString(),
    };

    settlementAdjustments.push(adjustment);
  }

  res.json({
    success: true,
    data: order as Order,
    message: '退款申请成功，分账数据已同步更新',
  });
});

export default router;
