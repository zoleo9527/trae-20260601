import { Router, Request, Response } from 'express';
import { stuckOrderService } from '../services/stuck-order';
import { StuckSeverity, StuckType } from '../types';

const router = Router();

const VALID_SEVERITIES = Object.values(StuckSeverity);
const VALID_STUCK_TYPES = Object.values(StuckType);
const VALID_ENTITY_TYPES = ['loading_plan', 'wagon_allocation', 'arrival_notice', 'damage_record'];

/**
 * GET /api/stuck-orders/summary
 *
 * 按卡单类型和严重度聚合活跃卡单数量、最早未处理时间
 * 结果按严重度(critical优先)和检测时间排序
 *
 * Response: StuckSummaryItem[]
 */
router.get('/summary', (_req: Request, res: Response) => {
  const summary = stuckOrderService.summary();
  res.json(summary);
});

/**
 * GET /api/stuck-orders
 *
 * 获取活跃卡单，支持查询参数过滤
 * 按严重度(critical优先)和检测时间排序返回
 *
 * Query Params:
 *   severity    string  可选，过滤严重度: warning | critical
 *   stuckType   string  可选，过滤卡单类型: plan_change_timeout | plan_unallocated | allocation_unconfirmed | arrival_unclaimed | damage_no_photo
 *   entityType  string  可选，过滤实体类型: loading_plan | wagon_allocation | arrival_notice | damage_record
 *   since       string  可选，检测时间起始 (ISO 8601)
 *   until       string  可选，检测时间截止 (ISO 8601)
 *
 * Response: StuckOrder[]
 */
router.get('/', (req: Request, res: Response) => {
  const { severity, stuckType, entityType, since, until } = req.query;

  if (severity && !VALID_SEVERITIES.includes(severity as StuckSeverity)) {
    res.status(400).json({ error: `无效的 severity 值，可选: ${VALID_SEVERITIES.join(', ')}` });
    return;
  }

  if (stuckType && !VALID_STUCK_TYPES.includes(stuckType as StuckType)) {
    res.status(400).json({ error: `无效的 stuckType 值，可选: ${VALID_STUCK_TYPES.join(', ')}` });
    return;
  }

  if (entityType && !VALID_ENTITY_TYPES.includes(entityType as string)) {
    res.status(400).json({ error: `无效的 entityType 值，可选: ${VALID_ENTITY_TYPES.join(', ')}` });
    return;
  }

  if (since && isNaN(Date.parse(since as string))) {
    res.status(400).json({ error: '无效的 since 时间格式，需 ISO 8601' });
    return;
  }

  if (until && isNaN(Date.parse(until as string))) {
    res.status(400).json({ error: '无效的 until 时间格式，需 ISO 8601' });
    return;
  }

  const results = stuckOrderService.filter({
    severity: severity as StuckSeverity | undefined,
    stuckType: stuckType as StuckType | undefined,
    entityType: entityType as 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record' | undefined,
    since: since as string | undefined,
    until: until as string | undefined,
  });

  res.json(results);
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
