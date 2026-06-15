import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import Role from '../models/Role';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: Role;
    storeId: number;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }

    const decoded = await AuthService.validateToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的token' });
  }
}

export function requireRole(roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export function requireStoreAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const storeId = parseInt(req.params.storeId || req.query.storeId as string || '0');
  if (storeId && req.user?.storeId !== storeId && req.user?.role !== Role.ADMIN) {
    return res.status(403).json({ error: '无权访问该门店数据' });
  }
  next();
}