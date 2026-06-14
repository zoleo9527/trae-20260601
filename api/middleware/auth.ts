import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}
