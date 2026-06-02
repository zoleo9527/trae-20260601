import { Router } from 'express';
import { afterSaleService } from '../services/afterSaleService.js';
import { z } from 'zod';

const router = Router();

const createAfterSaleSchema = z.object({
  orderId: z.string(),
  type: z.enum(['OUT_OF_STOCK', 'BAD_PRODUCT', 'WEIGHT_DIFF', 'OTHER']),
  reason: z.string().min(1),
  amount: z.number().int().optional(),
  badQuantity: z.number().int().min(0).optional(),
  totalQuantity: z.number().int().min(0).optional(),
  productId: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
});

const handleAfterSaleSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
  handledBy: z.string().min(1),
  comment: z.string().optional(),
});

// 创建售后单 - 客服
router.post('/after-sales', async (req, res) => {
  try {
    const dto = createAfterSaleSchema.parse(req.body);
    const result = await afterSaleService.createAfterSale(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取售后单列表
router.get('/after-sales', async (req, res) => {
  const { orderId, type, status } = req.query;
  const result = await afterSaleService.listAfterSales(
    orderId as string | undefined,
    type as any,
    status as any,
  );
  res.json({ success: true, data: result });
});

// 获取单个售后单
router.get('/after-sales/:id', async (req, res) => {
  const result = await afterSaleService.getAfterSale(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '售后单不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 处理售后单 - 客服/运营
router.post('/after-sales/:id/handle', async (req, res) => {
  try {
    const dto = handleAfterSaleSchema.parse(req.body);
    const result = await afterSaleService.handleAfterSale(req.params.id, dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
