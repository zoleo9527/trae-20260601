import { Router, Request, Response } from 'express';
import { handoverService } from '../services/handover';

const router = Router();

/**
 * GET /api/handovers/:entityType/:entityId
 *
 * 获取指定实体的完整交接留痕记录
 * 按时间排序，可追踪谁提交、谁确认、谁退回
 *
 * Response: HandoverRecord[]
 */
router.get('/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const records = handoverService.getRecordsForEntity(entityType, entityId);
  res.json(records);
});

export default router;
