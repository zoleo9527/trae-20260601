import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { sendFail } from '../common/response';
import { ErrorCode } from '../common/errorCode';

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        name: string;
        role: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return sendFail(res, ErrorCode.PARAM_MISSING, '缺少用户标识');
  }
  
  try {
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    
    req.currentUser = {
      id: user.id,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error) {
    return sendFail(res, ErrorCode.INTERNAL_ERROR);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return sendFail(res, ErrorCode.USER_NOT_FOUND);
    }
    
    if (!roles.includes(req.currentUser.role)) {
      return sendFail(res, ErrorCode.PERMISSION_DENIED);
    }
    
    next();
  };
}
