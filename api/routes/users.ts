
import { Router, type Request, type Response } from 'express';
import { getDemoUsers, getDashboardStats } from '../services/userService.js';

const router = Router();

router.get('/demo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = getDemoUsers();
    res.json(users);
  } catch (error) {
    console.error('Get demo users error:', error);
    res.status(500).json({ error: '获取演示账号失败' });
  }
});

router.get('/dashboard/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

export default router;
