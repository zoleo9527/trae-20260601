import { Router } from 'express';
import { adjustmentService } from '../services/adjustmentService.js';
import { z } from 'zod';

const router = Router();

const createAdjustmentSchema = z.object({
  orderId: z.string(),
  type: z.enum([
    'WEIGHT_REFUND',
    'WEIGHT_SUPPLEMENT',
    'OUT_OF_STOCK_REFUND',
    'BAD_PRODUCT_COMP',
    'COMMISSION_ADJUST',
    'OTHER',
  ]),
  amount: z.number().int(),
  reason: z.string().min(1),
  operator: z.string().min(1),
});

const handleAdjustmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED']),
  operator: z.string().min(1),
  comment: z.string().optional(),
});

// 创建补差记录 - 客服/运营
router.post('/adjustments', async (req, res) => {
  try {
    const dto = createAdjustmentSchema.parse(req.body);
    const result = await adjustmentService.createAdjustment(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取补差记录列表
router.get('/adjustments', async (req, res) => {
  const { orderId, type, status } = req.query;
  const result = await adjustmentService.listAdjustments(
    orderId as string | undefined,
    type as any,
    status as any,
  );
  res.json({ success: true, data: result });
});

// 获取未结算的补差记录
router.get('/adjustments/unsettled', async (_req, res) => {
  const result = await adjustmentService.listUnsettledAdjustments();
  res.json({ success: true, data: result });
});

// 获取单个补差记录
router.get('/adjustments/:id', async (req, res) => {
  const result = await adjustmentService.getAdjustment(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '补差记录不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 处理补差记录 - 财务/运营
router.post('/adjustments/:id/handle', async (req, res) => {
  try {
    const dto = handleAdjustmentSchema.parse(req.body);
    const result = await adjustmentService.handleAdjustment(req.params.id, dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
