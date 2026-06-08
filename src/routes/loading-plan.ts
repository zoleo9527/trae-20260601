import { Router, Request, Response } from 'express';
import { loadingPlanService } from '../services/loading-plan';
import { handoverService } from '../services/handover';
import { stuckOrderService } from '../services/stuck-order';

const router = Router();

/**
 * POST /api/loading-plans
 *
 * 货运员提交装车计划
 *
 * 幂等：传入 idempotencyKey 时，相同 key 只创建一次
 *
 * Body:
 *   planNo             string   计划编号
 *   freightTicketNo    string   关联货票号
 *   cargoType          string   货物品类
 *   cargoWeight        number   货物重量(吨)
 *   cargoVolume        number   货物体积(m³)
 *   plannedLoadDate    string   计划装车日期 (ISO)
 *   destinationStation string   到站
 *   submittedBy        string   提交人ID
 *   idempotencyKey?    string   幂等键
 *
 * Response: { plan: LoadingPlan, created: boolean }
 */
router.post('/', (req: Request, res: Response) => {
  const { planNo, freightTicketNo, cargoType, cargoWeight, cargoVolume, plannedLoadDate, destinationStation, submittedBy, idempotencyKey } = req.body;

  if (!planNo || !freightTicketNo || !cargoType || !cargoWeight || !plannedLoadDate || !destinationStation || !submittedBy) {
    res.status(400).json({ error: '缺少必填字段：planNo, freightTicketNo, cargoType, cargoWeight, plannedLoadDate, destinationStation, submittedBy' });
    return;
  }

  try {
    const result = loadingPlanService.submit({
      planNo,
      freightTicketNo,
      cargoType,
      cargoWeight: Number(cargoWeight),
      cargoVolume: cargoVolume ? Number(cargoVolume) : 0,
      plannedLoadDate,
      destinationStation,
      submittedBy,
      idempotencyKey,
    });
    res.status(result.created ? 201 : 200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/loading-plans/:planId/change
 *
 * 货运员变更装车计划
 * 变更后会触发卡单检测：超时未重新确认将产生 critical 卡单
 *
 * Body:
 *   changeReason string               变更原因
 *   changedBy    string               变更人
 *   changes      Record<string, any>  变更字段
 *
 * Response: LoadingPlan
 */
router.put('/:planId/change', (req: Request, res: Response) => {
  const { planId } = req.params;
  const { changeReason, changedBy, changes } = req.body;

  if (!changeReason || !changedBy || !changes) {
    res.status(400).json({ error: '缺少必填字段：changeReason, changedBy, changes' });
    return;
  }

  try {
    const plan = loadingPlanService.change(planId, { changeReason, changedBy, changes });
    const stuckOrders = stuckOrderService.getByEntity('loading_plan', planId);
    res.json({ plan, stuckOrders });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/loading-plans/:planId/return
 *
 * 装卸班长退回装车计划
 *
 * Body:
 *   returnedBy string  退回人ID
 *   reason     string  退回原因
 *
 * Response: LoadingPlan
 */
router.put('/:planId/return', (req: Request, res: Response) => {
  const { planId } = req.params;
  const { returnedBy, reason } = req.body;

  if (!returnedBy || !reason) {
    res.status(400).json({ error: '缺少必填字段：returnedBy, reason' });
    return;
  }

  try {
    const plan = loadingPlanService.return(planId, returnedBy, reason);
    res.json(plan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/loading-plans
 *
 * 列出所有装车计划
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(loadingPlanService.list());
});

/**
 * GET /api/loading-plans/:planId
 *
 * 获取装车计划详情（含交接记录和卡单）
 */
router.get('/:planId', (req: Request, res: Response) => {
  const plan = loadingPlanService.getById(req.params.planId);
  if (!plan) {
    res.status(404).json({ error: '装车计划不存在' });
    return;
  }

  const handovers = handoverService.getRecordsForEntity('loading_plan', plan.id);
  const stuckOrders = stuckOrderService.getByEntity('loading_plan', plan.id);
  res.json({ plan, handovers, stuckOrders });
});

export default router;
