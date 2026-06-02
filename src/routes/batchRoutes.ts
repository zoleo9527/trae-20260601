import { Router } from 'express';
import { fulfillmentBatchService } from '../services/fulfillmentBatchService.js';
import { z } from 'zod';

const router = Router();

const createBatchSchema = z.object({
  groupPointId: z.string(),
  deliveryDate: z.coerce.date(),
  orderIds: z.array(z.string()).min(1),
});

// 创建履约批次 - 运营
router.post('/batches', async (req, res) => {
  try {
    const dto = createBatchSchema.parse(req.body);
    const result = await fulfillmentBatchService.createBatch(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取批次列表
router.get('/batches', async (req, res) => {
  const { groupPointId, status } = req.query;
  const result = await fulfillmentBatchService.listBatches(
    groupPointId as string | undefined,
    status as any,
  );
  res.json({ success: true, data: result });
});

// 获取单个批次详情
router.get('/batches/:id', async (req, res) => {
  const result = await fulfillmentBatchService.getBatch(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '批次不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 标记已配送
router.post('/batches/:id/delivered', async (req, res) => {
  try {
    const result = await fulfillmentBatchService.markDelivered(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
