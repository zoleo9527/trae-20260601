import { Router, Request, Response } from 'express';
import { pendingTaskService } from '../services/pending-task';
import { Role } from '../types';

const router = Router();

const VALID_ROLES = Object.values(Role);

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
 *   role string 必填，角色: freight_clerk | loading_leader | customer_service
 *
 * Response: PendingTaskItem[]
 */
router.get('/', (req: Request, res: Response) => {
  const { role } = req.query;

  if (!role) {
    res.status(400).json({ error: '缺少必填查询参数: role (freight_clerk | loading_leader | customer_service)' });
    return;
  }

  if (!VALID_ROLES.includes(role as Role)) {
    res.status(400).json({ error: `无效的 role 值，可选: ${VALID_ROLES.join(', ')}` });
    return;
  }

  const tasks = pendingTaskService.getByRole(role as Role);
  res.json(tasks);
});

export default router;
