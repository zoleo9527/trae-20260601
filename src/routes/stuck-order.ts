import { Router, Request, Response } from 'express';
import { stuckOrderService } from '../services/stuck-order';

const router = Router();

/**
 * GET /api/stuck-orders
 *
 * 获取当前所有活跃卡单
 * 系统在每次请求时自动扫描，直接暴露卡住的流程
 *
 * Response: StuckOrder[]
 */
router.get('/', (_req: Request, res: Response) => {
  const stuckOrders = stuckOrderService.getActive();
  res.json(stuckOrders);
});

/**
 * GET /api/stuck-orders/:entityType/:entityId
 *
 * 查询指定实体的卡单
 *
 * Response: StuckOrder[]
 */
router.get('/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const stuckOrders = stuckOrderService.getByEntity(entityType, entityId);
  res.json(stuckOrders);
});

/**
 * PUT /api/stuck-orders/:stuckId/resolve
 *
 * 解除卡单
 *
 * Body:
 *   resolution string 解决说明
 *
 * Response: StuckOrder
 */
router.put('/:stuckId/resolve', (req: Request, res: Response) => {
  const { stuckId } = req.params;
  const { resolution } = req.body;

  if (!resolution) {
    res.status(400).json({ error: '缺少必填字段：resolution' });
    return;
  }

  const stuck = stuckOrderService.resolve(stuckId, resolution);
  if (!stuck) {
    res.status(404).json({ error: '卡单不存在' });
    return;
  }

  res.json(stuck);
});

/**
 * POST /api/stuck-orders/scan
 *
 * 手动触发全量扫描
 * 适用于定时任务或后台运维触发
 *
 * Response: StuckOrder[]
 */
router.post('/scan', (_req: Request, res: Response) => {
  const detected = stuckOrderService.scanAll();
  res.json(detected);
});

export default router;
