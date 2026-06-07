
import { Router, type Request, type Response } from 'express';
import { findUserByUsernameAndRole } from '../services/userService.js';
import type { LoginRequest } from '../../shared/types.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, role }: LoginRequest = req.body;

    if (!username || !role) {
      res.status(400).json({ error: '用户名和角色不能为空' });
      return;
    }

    const user = findUserByUsernameAndRole(username, role);

    if (!user) {
      res.status(401).json({ error: '用户名或角色错误' });
      return;
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true });
});

export default router;
