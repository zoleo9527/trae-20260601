import { Request, Response, NextFunction } from 'express';
import { db } from '../database';
import { UserRole, User } from '../types';

export interface AuthRequest extends Request {
  currentUser?: User;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  WINDOW_STAFF: [
    'view_application',
    'submit_materials',
    'register_payment',
    'view_payment',
    'issue_supplement_notice',
    'view_operation_logs',
  ],
  NOTARY: [
    'view_application',
    'review_materials',
    'confirm_payment',
    'view_payment',
    'issue_supplement_notice',
    'view_operation_logs',
    'view_certificate',
  ],
  ARCHIVIST: [
    'view_application',
    'arrange_certificate',
    'confirm_certificate_issue',
    'view_certificate',
    'view_payment',
    'view_operation_logs',
  ],
};

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    res.status(401).json({ error: '未提供用户ID，请在Header中设置x-user-id' });
    return;
  }

  const user = db.getUserById(userId) || db.getUserByEmployeeId(userId);
  
  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return;
  }

  req.currentUser = user;
  next();
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    
    if (!user) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions.includes(permission)) {
      res.status(403).json({ 
        error: '权限不足',
        userRole: user.role,
        requiredPermission: permission,
        availablePermissions: permissions
      });
      return;
    }

    next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    
    if (!user) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ 
        error: '角色权限不足',
        userRole: user.role,
        requiredRoles: roles
      });
      return;
    }

    next();
  };
}
