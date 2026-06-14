import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, UserRole } from './types';
import { db } from './db';

const JWT_SECRET = 'used-car-dealer-workflow-secret-key';

export function signToken(user: { id: string; username: string; name: string; role: UserRole }): string {
  return jwt.sign(
    { userId: user.id, username: user.username, name: user.name, role: user.role } as AuthTokenPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (!token) {
    res.status(401).json({ code: 401, message: '未登录，请先登录' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const user = db.findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ code: 401, message: '用户不存在' });
      return;
    }
    req.user = { userId: user.id, username: user.username, name: user.name, role: user.role };
    next();
  } catch (e) {
    res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 401, message: '未登录' });
      return;
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      res.status(403).json({ code: 403, message: `权限不足，需要角色：${allowedRoles.join('/')}` });
      return;
    }
    next();
  };
}
