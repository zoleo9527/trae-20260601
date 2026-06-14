import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getStatusLogs } from '../services/statusLogService';

const router = Router();

router.get('/:entityType/:entityId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await getStatusLogs(entityType, entityId);

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取状态流转记录失败' });
  }
});

export default router;
