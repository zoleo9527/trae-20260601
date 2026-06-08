import type { Request, Response, NextFunction } from 'express';
import type { Role, User } from './types.js';
import { store } from './data-store.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: '缺少 X-User-Id 请求头' });
    return;
  }
  const user = store.getUser(userId);
  if (!user) {
    res.status(401).json({ error: `用户 ${userId} 不存在` });
    return;
  }
  req.currentUser = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: '未认证' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({
        error: `权限不足：当前角色为 ${req.currentUser.role}，需要 ${roles.join(' 或 ')}`,
      });
      return;
    }
    next();
  };
}
