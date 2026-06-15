import express, { type Request, type Response } from 'express';
import { users, getUserByUsername } from '../store/mockStore.js';
import type { User, UserRole } from '../../shared/types.js';
import { ERROR_CODES } from '../../shared/types.js';

const router = express.Router();

router.get('/users', (_req: Request, res: Response) => {
  res.status(200).json({
    code: ERROR_CODES.SUCCESS,
    message: 'ok',
    data: users.map(({ id, name, role, username }) => ({ id, name, role, username })),
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, role } = req.body as { username?: string; role?: UserRole };
  let user: User | undefined;
  if (username) {
    user = getUserByUsername(username);
  } else if (role) {
    user = users.find((u) => u.role === role);
  }
  if (!user) {
    res.status(400).json({
      code: ERROR_CODES.PERMISSION_DENIED,
      message: '登录失败：用户不存在',
      data: null,
    });
    return;
  }
  res.status(200).json({
    code: ERROR_CODES.SUCCESS,
    message: '登录成功',
    data: {
      id: user.id,
      name: user.name,
      role: user.role,
      username: user.username,
    },
  });
});

export default router;
