
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
      (s) => s.stationId === order.stationId && s.date === settlementMonth
    );

    if (!settlement) {
      const newSettlementId = `set${settlements.length + 1}`;
      settlement = {
        id: newSettlementId,
        date: settlementMonth,
        stationId: station.id,
        stationName: station.name,
        totalAmount: 0,
        platformShare: 0,
        partnerShare: 0,
        refundDeduction: 0,
        finalPartnerShare: 0,
        status: 'pending',
      };
      settlements.push(settlement);
    }

    const splitRatio = station.splitRatio || 0.7;
    const partnerShareAmount = refundAmount * splitRatio;

    settlement.refundDeduction += refundAmount;
    settlement.totalAmount = Math.max(0, settlement.totalAmount - refundAmount);
    settlement.partnerShare = Math.max(0, settlement.partnerShare - partnerShareAmount);
    settlement.platformShare = Math.max(0, settlement.platformShare - (refundAmount - partnerShareAmount));
    settlement.finalPartnerShare = Math.max(0, settlement.partnerShare - settlement.refundDeduction);

    if (settlement.totalAmount === 0) {
      settlement.finalPartnerShare = 0;
    }

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
