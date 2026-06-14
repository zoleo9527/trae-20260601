import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getTodosByRole } from '../services/todoService';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const todos = await getTodosByRole(user.role as any, user.userId);

    res.json({
      todos,
      total: todos.length,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取待办列表失败' });
  }
});

export default router;
