import { Router, Request, Response } from 'express';
import { stuckOrderService } from '../services/stuck-order';
import { StuckSeverity, StuckType, BatchResolveResult } from '../types';

const router = Router();

const VALID_SEVERITIES = Object.values(StuckSeverity);
const VALID_STUCK_TYPES = Object.values(StuckType);
const VALID_ENTITY_TYPES = ['loading_plan', 'wagon_allocation', 'arrival_notice', 'damage_record'];

/**
 * GET /api/stuck-orders/summary
 *
 * 按卡单类型和严重度聚合活跃卡单
 * 结果按严重度(critical优先)和检测时间排序
 * 顶层附加 totalActive 和 oldestUnresolvedAt 汇总字段
 *
 * Response: StuckSummaryResponse { groups, totalActive, oldestUnresolvedAt }
 */
router.get('/summary', (_req: Request, res: Response) => {
  const summary = stuckOrderService.summary();
  res.json(summary);
});

/**
 * POST /api/stuck-orders/batch-resolve
 *
 * 批量结案卡单
 * 对每个卡单复用现有结案逻辑，返回成功与失败明细
 *
 * Body:
 *   stuckIds   string[]  卡单ID数组
 *   resolution string    统一结案备注
 *
 * Response: BatchResolveResult { resolved, totalRequested, totalSucceeded, totalFailed }
 */
router.post('/batch-resolve', (req: Request, res: Response) => {
  const { stuckIds, resolution } = req.body;

  if (!Array.isArray(stuckIds) || stuckIds.length === 0) {
    res.status(400).json({ error: '缺少必填字段：stuckIds (非空数组)' });
    return;
  }

  if (!resolution || typeof resolution !== 'string') {
    res.status(400).json({ error: '缺少必填字段：resolution (字符串)' });
    return;
  }

  const resolved = stuckOrderService.batchResolve(stuckIds, resolution);

  const totalSucceeded = resolved.filter((r) => r.success).length;
  const result: BatchResolveResult = {
    resolved,
    totalRequested: stuckIds.length,
    totalSucceeded,
    totalFailed: stuckIds.length - totalSucceeded,
  };

  res.json(result);
});

/**
 * GET /api/stuck-orders
 *
 * 获取活跃卡单，支持查询参数过滤
 * 按严重度(critical优先)和检测时间排序返回
 *
 * Query Params:
 *   severity    string  可选，过滤严重度: warning | critical
 *   stuckType   string  可选，过滤卡单类型
 *   entityType  string  可选，过滤实体类型
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
 * POST /api/stuck-orders/:id/reopen
 *
 * 重开已结案卡单
 * 清除 resolvedAt/resolution，写入 action=alert 交接记录
 * 已活跃或不存在的卡单返回 4xx 错误
 *
 * Body:
 *   reason string 重开原因
 *
 * Response: { stuck: StuckOrder }
 */
router.post('/:id/reopen', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({ error: '缺少必填字段：reason' });
    return;
  }

  const result = stuckOrderService.reopen(id, reason);

  if (result.error) {
    if (result.error === '卡单不存在') {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(409).json({ error: result.error, stuck: result.stuck });
    return;
  }

  res.json({ stuck: result.stuck });
});

/**
 * GET /api/stuck-orders/:id/trail
 *
 * 返回该卡单所关联实体的交接记录链
 * 按时间倒序展示谁在何时执行了哪种动作和角色流转
 *
 * Response: { stuck: StuckOrder, trail: HandoverRecord[] }
 */
router.get('/:id/trail', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = stuckOrderService.getTrail(id);

  if (!result) {
    res.status(404).json({ error: '卡单不存在' });
    return;
  }

  res.json(result);
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
 * 解除单个卡单
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
 *
 * Response: StuckOrder[]
 */
router.post('/scan', (_req: Request, res: Response) => {
  const detected = stuckOrderService.scanAll();
  res.json(detected);
});

export default router;
