import { Router, Request, Response } from 'express';
import { wagonAllocationService } from '../services/wagon-allocation';
import { handoverService } from '../services/handover';
import { stuckOrderService } from '../services/stuck-order';

const router = Router();

/**
 * POST /api/wagon-allocations
 *
 * 为装车计划分配车皮
 *
 * 幂等：传入 idempotencyKey 时，相同 key 只创建一次
 *
 * Body:
 *   loadingPlanId string  装车计划ID
 *   wagonNo       string  车皮号
 *   wagonType     string  车型
 *   loadCapacity  number  标定载重(吨)
 *   allocatedBy   string  分配人ID
 *   idempotencyKey? string 幂等键
 *
 * Response: { allocation: WagonAllocation, created: boolean }
 */
router.post('/', (req: Request, res: Response) => {
  const { loadingPlanId, wagonNo, wagonType, loadCapacity, allocatedBy, idempotencyKey } = req.body;

  if (!loadingPlanId || !wagonNo || !wagonType || !loadCapacity || !allocatedBy) {
    res.status(400).json({ error: '缺少必填字段：loadingPlanId, wagonNo, wagonType, loadCapacity, allocatedBy' });
    return;
  }

  try {
    const result = wagonAllocationService.allocate({
      loadingPlanId,
      wagonNo,
      wagonType,
      loadCapacity: Number(loadCapacity),
      allocatedBy,
      idempotencyKey,
    });
    res.status(result.created ? 201 : 200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/wagon-allocations/:allocationId/confirm
 *
 * 装卸班长确认车皮分配
 * 若存在未解决卡单则拒绝确认
 *
 * Body:
 *   confirmedBy     string  确认人ID
 *   actualLoadWeight? number 实际装载量(吨)
 *
 * Response: WagonAllocation
 */
router.put('/:allocationId/confirm', (req: Request, res: Response) => {
  const { allocationId } = req.params;
  const { confirmedBy, actualLoadWeight } = req.body;

  if (!confirmedBy) {
    res.status(400).json({ error: '缺少必填字段：confirmedBy' });
    return;
  }

  try {
    const allocation = wagonAllocationService.confirm(allocationId, {
      confirmedBy,
      actualLoadWeight: actualLoadWeight ? Number(actualLoadWeight) : undefined,
    });
    res.json(allocation);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/wagon-allocations
 *
 * 列出所有车皮分配
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(wagonAllocationService.list());
});

/**
 * GET /api/wagon-allocations/:allocationId
 *
 * 获取车皮分配详情（含交接记录和卡单）
 */
router.get('/:allocationId', (req: Request, res: Response) => {
  const allocation = wagonAllocationService.getById(req.params.allocationId);
  if (!allocation) {
    res.status(404).json({ error: '车皮分配不存在' });
    return;
  }

  const handovers = handoverService.getRecordsForEntity('wagon_allocation', allocation.id);
  const stuckOrders = stuckOrderService.getByEntity('wagon_allocation', allocation.id);
  res.json({ allocation, handovers, stuckOrders });
});

/**
 * GET /api/wagon-allocations/plan/:planId/history
 *
 * 车皮分配回看：某装车计划的完整分配历史、交接记录和卡单
 */
router.get('/plan/:planId/history', (req: Request, res: Response) => {
  const { planId } = req.params;
  const history = wagonAllocationService.getAllocationHistory(planId);
  res.json(history);
});

export default router;
