import { Router } from 'express';
import { settlementService } from '../services/settlementService.js';
import { z } from 'zod';

const router = Router();

const createSettlementSchema = z.object({
  leaderId: z.string(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  batchIds: z.array(z.string()).min(1),
  createdBy: z.string().min(1),
});

// 创建结算单 - 运营发起批次结算
router.post('/settlements', async (req, res) => {
  try {
    const dto = createSettlementSchema.parse(req.body);
    const result = await settlementService.createSettlement(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 获取结算单列表
router.get('/settlements', async (req, res) => {
  const { leaderId, status } = req.query;
  const result = await settlementService.listSettlements(
    leaderId as string | undefined,
    status as any,
  );
  res.json({ success: true, data: result });
});

// 获取单个结算单详情（含明细行）
router.get('/settlements/:id', async (req, res) => {
  const result = await settlementService.getSettlement(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: '结算单不存在' });
    return;
  }
  res.json({ success: true, data: result });
});

// 提交审核 - 运营
router.post('/settlements/:id/submit', async (req, res) => {
  try {
    const result = await settlementService.submitForReview(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 锁定结算单 - 财务
router.post('/settlements/:id/lock', async (req, res) => {
  try {
    const { lockedBy } = z.object({ lockedBy: z.string().min(1) }).parse(req.body);
    const result = await settlementService.lockSettlement(req.params.id, lockedBy);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 标记已支付 - 财务
router.post('/settlements/:id/paid', async (req, res) => {
  try {
    const result = await settlementService.markPaid(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 标记有异议 - 团长/运营
router.post('/settlements/:id/dispute', async (req, res) => {
  try {
    const result = await settlementService.flagDispute(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// 团长查看自己的结算明细
router.get('/leaders/:leaderId/settlements/:settlementId', async (req, res) => {
  const result = await settlementService.getLeaderSettlementDetails(
    req.params.leaderId,
    req.params.settlementId,
  );
  if (!result) {
    res.status(404).json({ success: false, error: '结算单不存在或无权查看' });
    return;
  }
  res.json({ success: true, data: result });
});

export default router;
