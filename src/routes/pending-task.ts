import { Router, Request, Response } from 'express';
import { pendingTaskService } from '../services/pending-task';
import { Role } from '../types';

const router = Router();

const VALID_ROLES = Object.values(Role);

/**
 * GET /api/pending-tasks/summary
 *
 * 按 role 和 entityType 聚合活跃待办数量、最长停留时长、被卡单阻断的条目数
 * 结果按阻断数降序、最长停留时长降序排列
 *
 * Response: PendingTaskSummaryItem[]
 */
router.get('/summary', (_req: Request, res: Response) => {
  const summary = pendingTaskService.summary();
  res.json(summary);
});

/**
 * GET /api/pending-tasks?role=freight_clerk|loading_leader|customer_service
 *
 * 按角色聚合当前需要跟进的待办事项
 * 结合交接记录与卡单计算每个角色需要处理的实体
 *
 * 返回各实体最新状态、停留时长和阻断原因
 * 阻断的待办排在前面，停留时间长的排在前面
 *
 * Query Params:
 *   role          string   必填，角色: freight_clerk | loading_leader | customer_service
 *   minDwellHours number   可选，最小停留时长(小时)，筛选长期滞留的待办
 *   blockedOnly   boolean  可选，仅返回被卡单阻断的待办 (true/false)
 *
 * Response: PendingTaskItem[]
 */
router.get('/', (req: Request, res: Response) => {
  const { role, minDwellHours, blockedOnly } = req.query;

  if (!role) {
    res.status(400).json({ error: '缺少必填查询参数: role (freight_clerk | loading_leader | customer_service)' });
    return;
  }

  if (!VALID_ROLES.includes(role as Role)) {
    res.status(400).json({ error: `无效的 role 值，可选: ${VALID_ROLES.join(', ')}` });
    return;
  }

  let minDwell: number | undefined;
  if (minDwellHours !== undefined) {
    minDwell = parseFloat(minDwellHours as string);
    if (isNaN(minDwell) || minDwell < 0) {
      res.status(400).json({ error: 'minDwellHours 须为非负数字' });
      return;
    }
  }

  let blocked: boolean | undefined;
  if (blockedOnly !== undefined) {
    blocked = blockedOnly === 'true';
  }

  const tasks = pendingTaskService.getByRole(role as Role, {
    minDwellHours: minDwell,
    blockedOnly: blocked,
  });

  res.json(tasks);
});

export default router;
