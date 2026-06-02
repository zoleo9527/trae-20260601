
import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../data/store.js';
import type { User, LoginResponse } from '../../shared/types.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'charging-station-secret-key';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user || password !== '123456') {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误',
    });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const response: LoginResponse = {
    token,
    user: user as User,
  };

  res.json({
    success: true,
    data: response,
  });
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '未授权',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.find((u) => u.id === decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: user as User,
    });
  } catch {
    res.status(401).json({
      success: false,
      message: 'Token无效',
    });
  }
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: '退出成功',
  });
});

export default router;
