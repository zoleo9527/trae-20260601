import { Router, Request, Response } from 'express';
import { login } from '../services/authService';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const result = await login(username, password);

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || '登录失败' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: '登出成功' });
});

export default router;
