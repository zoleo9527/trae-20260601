import { Router, Request, Response } from 'express';
import { handoverService } from '../services/handover';
import { HandoverAction, Role } from '../types';

const router = Router();

const VALID_ROLES = Object.values(Role);
const VALID_ACTIONS = Object.values(HandoverAction);
const VALID_ENTITY_TYPES = ['loading_plan', 'wagon_allocation', 'arrival_notice', 'damage_record'];

/**
 * GET /api/handovers/summary
 *
 * 按 role 和 action 双维度聚合交接次数
 * 支持 since、until 查询参数
 * 附带 totalRecords 顶层字段
 *
 * Query Params:
 *   since  string  可选，时间起始 (ISO 8601)
 *   until  string  可选，时间截止 (ISO 8601)
 *
 * Response: HandoverSummaryResponse { groups, totalRecords }
 */
router.get('/summary', (req: Request, res: Response) => {
  const { since, until } = req.query;

  if (since && isNaN(Date.parse(since as string))) {
    res.status(400).json({ error: '无效的 since 时间格式，需 ISO 8601' });
    return;
  }

  if (until && isNaN(Date.parse(until as string))) {
    res.status(400).json({ error: '无效的 until 时间格式，需 ISO 8601' });
    return;
  }

  const summary = handoverService.summary(
    since as string | undefined,
    until as string | undefined
  );

  res.json(summary);
});

/**
 * GET /api/handovers
 *
 * 查询交接记录，支持多条件过滤
 * 按 timestamp 倒序返回
 *
 * Query Params:
 *   role        string  可选，按角色过滤（fromRole 或 toRole 匹配）
 *   action      string  可选，按动作过滤: submit | confirm | return | alert | change
 *   entityType  string  可选，按实体类型过滤
 *   since       string  可选，时间起始 (ISO 8601)
 *   until       string  可选，时间截止 (ISO 8601)
 *
 * Response: HandoverRecord[]
 */
router.get('/', (req: Request, res: Response) => {
  const { role, action, entityType, since, until } = req.query;

  if (role && !VALID_ROLES.includes(role as Role)) {
    res.status(400).json({ error: `无效的 role 值，可选: ${VALID_ROLES.join(', ')}` });
    return;
  }

  if (action && !VALID_ACTIONS.includes(action as HandoverAction)) {
    res.status(400).json({ error: `无效的 action 值，可选: ${VALID_ACTIONS.join(', ')}` });
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

  const results = handoverService.query({
    role: role as Role | undefined,
    action: action as HandoverAction | undefined,
    entityType: entityType as 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record' | undefined,
    since: since as string | undefined,
    until: until as string | undefined,
  });

  res.json(results);
});

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
